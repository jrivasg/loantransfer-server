const Bid = require("../../Models/bid.model");
const JWT = require("jsonwebtoken");
const { promisify } = require("util");
const client = require("../../helpers/init_redis");
const getAsyncRedis = promisify(client.get).bind(client);
var mongoose = require("mongoose");
const aws_email = require("../../helpers/aws_email");
const User = require("../../Models/User.model");
const { getHtmltoSend } = require("../../Templates/useTemplate");
const { clearTimeout } = require("timers");

const NEW_BID_EVENT = "newBidEvent";
const STARTING_BID = "startingBid";
const FINISHING_BID = "finishingBid";

let bidnsp = null;
let activeUsers = {};
let activeBids = {};

module.exports = (io) => {
  bidnsp = io.of("bid");
  bidnsp.on("connection", async (socket) => {
    console.log(socket.id + " connected to bid socket");

    // Unimos a la sala de subastas
    const { roomId, token } = socket.handshake.query;
    const payload = await verifyAccessToken(token);
    socket.join(roomId);
    const { displayName, company } = await User.findById(payload.aud)
      .select("displayName company")
      .lean();
    activeUsers[payload.aud] = { socket_id: socket.id, displayName, company };

    // Listen for new bids
    socket.on(NEW_BID_EVENT, (data) => {
      console.log(
        socket.id + " realizó una puja por valor de " + data.body.amount
      );
      // Se comprueba si la puja es valida y si lo es se guarda en el log
      saveSendLastBid(data, roomId, payload);
    });

    // Eventos para la desconexión
    socket.on("disconnect", (reason) => {
      // Desconectamos el socket de la room
      socket.leave(roomId);

      // Eliminamos el usuario del objeto de usuarios activos
      delete activeUsers[payload.aud];
    });

    // Si hay subastas activas añadimos el usuario a la lista de viewers
    // si estas subastas no tienen timers de star y finish se programan
    const nextHourBids = await getNextHourBids();
    if (nextHourBids.length > 0) {
      // Añadimos al usuario conectado a los que han estado viendo las subastas activas
      addUserToActiveBids(payload.aud);
      setStartTimer({
        io,
        roomId,
        socket_id: socket.id,
        user_id: payload.aud,
        nextHourBids,
      });
    }
  });
};

const saveSendLastBid = async (data, roomId, payload) => {
  const { bid_id, amount, subbid_id } = data.body;

  try {
    // Obtenemos la subasta y el lote, asi como su log de pujas en redis.
    let redisLog = Array.from(
      JSON.parse(
        await getAsyncRedis(subbid_id).catch((err) => console.error(err))
      )
    );

    // Obtenemos la últimas puja
    const lastBidRedis = redisLog[redisLog.length - 1];

    // Si la ultima cantidad guardada no es la mismas q esta observando al pujar el cliente porque otro se haya adelantado, se desecha.
    // También se comprueba si la ultima puja fue propia para no pujar doble
    if (lastBidRedis.amount === amount || lastBidRedis.from === payload.aud)
      return;

    // Le sumamos 30 segundos al tiempo actual de fin si quedan menos de 1 min
    const endDateTime = new Date(lastBidRedis.endTime);
    let newEndDateTime;
    endDateTime.getTime() - new Date().getTime() < 1 * 60 * 1000 &&
      (newEndDateTime = extendTimer({
        endDateTime,
        bid_id,
        roomId,
        subbid_id,
      }));

    // Creamos una nueva puja con los datos del pujador y de las cantidades y se añade al log
    const puja = {
      from: payload.aud,
      name: `${activeUsers[payload.aud].displayName} de ${
        activeUsers[payload.aud].company
      }`,
      time: new Date(),
      bid_id,
      amount: amount, // nextAmount
      subbid_id,
      active: true,
      endTime: newEndDateTime ?? endDateTime,
    };

    redisLog.push(puja);

    // Se guarda de nuevo el log en redis
    client.SET(subbid_id, JSON.stringify(redisLog), (err, reply) => {
      if (err) console.log(err.message);
    });

    // Calculamos el nuevo tiempo de fin para mandarlo en el evento puja
    puja.endTime = new Date(puja.endTime).getTime() - new Date().getTime();

    bidnsp.in(roomId).emit(NEW_BID_EVENT, puja);

    // Guardamos en DB la puja
    Bid.findByIdAndUpdate(
      bid_id,
      {
        $set: {
          "bids.$[el].data": redisLog,
        },
      },
      {
        arrayFilters: [{ "el._id": subbid_id }],
        new: true,
      },
      async (err, bid) => {
        if (err) res.status(500).json(err);
      }
    ).catch((err) => console.error(err));
  } catch (error) {
    console.log(error);
  }
};

const setStartTimer = async ({
  io,
  roomId,
  user_id,
  socket_id,
  nextHourBids,
}) => {
  // Se itera las subastas para obtener sus datos y enviarlas al método startBid para iniciarla
  nextHourBids.forEach(async (eachBid) => {
    // Tiempo hasta el inicio de la subasta
    let interval = new Date(eachBid.starting_time).getTime() - Date.now();
    //console.log("interval", interval);

    // Si existe el objeto de la subasta y tiene un start_timer programado se envía la info actual de la subasta sin
    // programar timer o modificar info alguna y se añade al ususario a la lista de viewers
    if (activeBids[eachBid._id]?.startTimer) {
      setTimeout(async () => {
        //console.log('Timeout ejecutado')
        // Se obtienen los lotes y se busca en redis la info de la ultima puja, o la inicial si aun no se ha iniciado
        const redisSubbidsArray = await getArraySubbidsCurrrentResult({
          eachBid,
        });
        bidnsp.to(socket_id).emit(STARTING_BID, redisSubbidsArray);
        addUserToActiveBids(user_id);
      }, interval);

      return;
    } else {
      // Si queda tiempo para el inicio de la puja, se pone un temporizador y al final de la misma se envia
      // la info sobre las pujas obtenida de redis

      // Se guarda en memoria el id del timer para no volver a ejecutar el método.
      activeBids = {
        [eachBid._id]: {
          viewers: [],
          starting_time: eachBid.starting_time,
          end_time: eachBid.end_time,
        },
      };

      const startTimer = setTimeout(async () => {
        // Se obtienen los lotes y se busca en redis la info de la ultima puja, o la inicial si aun no se ha iniciado
        const redisSubbidsArray = await getArraySubbidsCurrrentResult({
          eachBid,
        });
        startBid({ redisSubbidsArray, eachBid, roomId });
      }, interval);

      activeBids[eachBid._id].startTimer = startTimer;
    }
  });
};

// Método que envía el mensaje de startBiding a los miembros conectados a la sala
const startBid = ({ redisSubbidsArray, eachBid, roomId, socket_id }) => {
  // Se itera sobre cada lote para crear su objeto y settear a true su propiedad active en memoria y se envía a la room
  redisSubbidsArray.forEach((eachsubbid) => {
    activeBids[eachBid._id] = {
      ...activeBids[eachBid._id],
      active: true,
      [eachsubbid.subbid_id]: { active: true },
    };
  });

  bidnsp.in(roomId).emit(STARTING_BID, redisSubbidsArray);

  Bid.findByIdAndUpdate(
    eachBid._id,
    {
      active: true,
      $set: { "bids.$[].active": true },
    },
    async (err, bid) => {
      if (err) res.status(500).json(err);
    }
  );

  setInitialFinishTimer({ roomId, eachBid });
  // Se añade los usuarios presentes al registro de viewers
  Object.keys(activeUsers).forEach((key) => {
    addUserToActiveBids(key);
  });
};

const setInitialFinishTimer = async ({ eachBid, roomId }) => {
  if (activeBids[eachBid._id]?.finishTimer) return;

  // Se programan todos los timers de primeras
  const interval = new Date(eachBid.end_time).getTime() - Date.now();

  // Se itera sobre cada lote para programarle un timer
  eachBid.bids.forEach((lote) => {
    if (activeBids[eachBid._id][lote._id]?.finishTimer) return;
    // Programamos el timer para cada lote
    const finishTimerId = setTimeout(() => {
      finishSubBid({ eachBid, room_id: roomId, subbid_id: lote._id });
    }, interval);
    console.log(`InitialFinishTimer para ${lote._id} programado`);
    activeBids[eachBid._id][lote._id] = {
      ...activeBids[eachBid._id][lote._id],
      endTime: eachBid.end_time,
      finishTimer: finishTimerId,
    };
  });
  activeBids[eachBid._id].finishTimer = true;
  //console.log("activeBids", activeBids);
};

const setNewFinishTimer = async ({
  room_id,
  newEndDateTime,
  eachBid,
  subbid_id,
}) => {
  // Se quiere extender el timer de un lote concreto se borra el timer anterior
  clearTimeout(activeBids[eachBid._id][subbid_id].finishTimer);

  const interval = newEndDateTime.getTime() - Date.now();

  // Se guarda en memoria la fecha en la que termina la subasta si hay una nueva
  newEndDateTime &&
    (activeBids[eachBid._id][subbid_id].endTime = newEndDateTime);

  // Programamos el timer
  const finishTimerId = setTimeout(() => {
    finishSubBid({ eachBid, room_id, subbid_id });
  }, interval);
  console.log(`Timer programado para lote ${subbid_id}`);
  // Guardamos la referencia del timer para borrarlo en caso de tener que extenderlo
  activeBids[eachBid._id][subbid_id].finishTimer = finishTimerId;
};

const finishSubBid = async ({ eachBid, room_id, subbid_id }) => {
  // Guardamos la información del lote finalizado
  const query = await Bid.find(
    {
      _id: eachBid._id,
      "bids._id": subbid_id,
    },
    { "bids.$": 1 }
  );
  const subbid = query[0].bids[0];

  saveFinishSubBidData({ eachBid, subbid });

  const subbidCurrrentResult = await getSubbidCurrrentResult({
    eachBid,
    subbid,
  });

  subbidCurrrentResult.finish = true;
  subbidCurrrentResult.active = false;
  subbidCurrrentResult.endTime = 0;

  // Eliminamos el objeto de la puja al finalizar
  delete activeBids[eachBid._id][subbid_id];
  console.log(`Lote ${subbid_id} finalizado`);

  setTimeout(() => {
    // Enviamos el evento de finalización a todos los clientes conectados
    return bidnsp.in(room_id).emit(FINISHING_BID, subbidCurrrentResult);
  }, 1000);
};

const saveFinishSubBidData = async ({ eachBid, subbid }) => {
  try {
    // Guardamos en DB la puja
    Bid.findByIdAndUpdate(
      eachBid._id,
      {
        $set: {
          "bids.$[el].finish": true,
          "bids.$[el].active": false,
          "bids.$[el].buyer":
            subbid.data[subbid.data.length - 1]?.from &&
            subbid.data[subbid.data.length - 1].from,
          "bids.$[el].finalAmount":
            subbid.data[subbid.data.length - 1]?.amount &&
            subbid.data[subbid.data.length - 1].amount,
        },
      },
      {
        arrayFilters: [{ "el._id": subbid._id }],
        new: true,
      },
      async (err, bid) => {
        if (err) res.status(500).json(err);
        let jsonBid = JSON.parse(JSON.stringify(bid));
        //console.log("Bid modificado", jsonBid);
        if (isAllSubbidFinished(jsonBid)) {
          console.log("Todas los lotes finalizados");
          // Guardamos en DB la puja
          Bid.findByIdAndUpdate(eachBid._id, {
            finish: true,
            active: false,
          }).catch((err) => console.error(err));
          // Si no ha habido ganador no se envía el email
          subbid.data[subbid.data.length - 1]?.from && sendWinnerEmail(jsonBid);
        }
      }
    ).catch((err) => console.error(err));
  } catch (error) {
    console.log(error);
  }
};

const getSubbidCurrrentResult = async ({ eachBid, subbid }) => {
  let redisSubbid =
    subbid &&
    JSON.parse(
      await getAsyncRedis(String(subbid._id)).catch((err) => {
        if (err) console.error(err);
      })
    );

  // Si no existe en redis creamos el objeto y lo setteamos
  if (!redisSubbid) {
    redisSubbid = [
      {
        from: null,
        time: new Date(),
        bid_id: eachBid._id,
        amount: subbid.minimunAmount,
        subbid_id: subbid._id,
        active: false,
        finish: false,
        endTime: new Date(eachBid.end_time),
        viewers: [],
      },
    ];

    client.SET(
      String(subbid._id),
      JSON.stringify(redisSubbid),
      (err, reply) => {
        if (err) console.log(err.message);
      }
    );
  }

  // Se obtiene la última puja de cada lote y se transforma el endTime al tiempo que queda hasta el fin de la subasta
  redisSubbid[redisSubbid.length - 1].endTime =
    new Date(redisSubbid[redisSubbid.length - 1].endTime).getTime() -
    new Date().getTime();

  return redisSubbid;
};

// Se itera sobre los diferentes lotes y se obtiene la info de las pujas de redis
const getArraySubbidsCurrrentResult = async ({ eachBid }) => {
  const subbidIdArray = eachBid.bids.map((eachsubbid) =>
    String(eachsubbid._id)
  );

  const subbids = [];
  const promises = [];

  for (const subbid_id of subbidIdArray) {
    let redisSubbid = JSON.parse(
      await getAsyncRedis(subbid_id).catch((err) => {
        if (err) console.error(err);
      })
    );
    // Si no existe en redis creamos el objeto y lo setteamos
    if (!redisSubbid) {
      const tempSubbid = eachBid.bids.find(
        (bid) => String(bid._id) === String(subbid_id)
      );

      redisSubbid = [
        {
          from: null,
          time: new Date(),
          bid_id: eachBid._id,
          amount: tempSubbid.minimunAmount,
          subbid_id,
          active: true,
          finish: false,
          endTime: new Date(eachBid.end_time),
          viewers: [],
        },
      ];

      client.SET(
        String(tempSubbid._id),
        JSON.stringify(redisSubbid),
        (err, reply) => {
          if (err) console.log(err.message);
        }
      );
    }
    // Se obtiene la última puja de cada lote y se transforma el endTime al tiempo que queda hasta el fin de la subasta
    redisSubbid[redisSubbid.length - 1].endTime =
      new Date(redisSubbid[redisSubbid.length - 1].endTime).getTime() -
      new Date().getTime();
    redisSubbid[redisSubbid.length - 1].active = true;

    redisSubbid && subbids.push(redisSubbid[redisSubbid.length - 1]);
    promises.push(subbids);
  }

  await Promise.all(subbids);
  return subbids;
};

const verifyAccessToken = (authtoken) => {
  //console.log("verificando token", authtoken);
  return new Promise((resolve, reject) => {
    JWT.verify(authtoken, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return message;
      }
      resolve(payload);
    });
  });
};

const getNextHourBids = async () => {
  const now = new Date();
  let startingMoment = new Date();
  startingMoment.setHours(now.getHours() - 2);
  let endingMoment = new Date();
  endingMoment.setHours(now.getHours() + 2);

  try {
    return await Bid.find({
      starting_time: { $gte: startingMoment, $lte: endingMoment },
      finish: false,
    }).lean();
  } catch (err) {
    console.log(err);
  }
};

const sendWinnerEmail = async (eachBid) => {
  const winners = groupByWinner(eachBid);

  Object.keys(winners).forEach(async (key) => {
    // Obtención de datos para envío de nueva y subasta y programar envío de recordatorio
    const winner = await User.findById(key).lean();
    const company = await User.findById(eachBid.seller).select("company");

    const email_message = getHtmltoSend(
      "../Templates/bid/bid_winner_template.hbs",
      {
        bid: eachBid,
        subbids: winners[key],
        company: company.company,
      }
    );
    const email_subject = "Ha ganado usted la subasta";
    const emailSentInfo = await aws_email.sendEmail(
      winner.email,
      email_subject,
      email_message,
      "logo_loan_transfer.png"
    );

    console.log("Email ganador subasta enviado a ", emailSentInfo.accepted);

    emailSentInfo.accepted.length > 0 &&
      Bid.findByIdAndUpdate(eachBid._id, {
        $set: { "notifications.winner": true },
      }).catch((err) => console.error(err));
  });
};

function minTommss(minutes) {
  var sign = minutes < 0 ? "-" : "";
  var min = Math.floor(Math.abs(minutes));
  var sec = Math.floor((Math.abs(minutes) * 60) % 60);
  return sign + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
}

const extendTimer = ({ endDateTime, bid_id, roomId, subbid_id }) => {
  const newEndDateTime = new Date(endDateTime.getTime() + 30 * 1000);

  Bid.findByIdAndUpdate(
    bid_id,
    {
      end_time: newEndDateTime,
    },
    { new: true },
    async (err, bid) => {
      if (err) res.status(500).json(err);
      console.log("nuevo end_time", bid.end_time);

      const jsonBid = JSON.parse(JSON.stringify(bid));
      // Programamos nuevo finishTimer
      setNewFinishTimer({
        roomId,
        eachBid: jsonBid,
        newEndDateTime,
        subbid_id,
      });
    }
  );

  return newEndDateTime;
};

const groupByWinner = (bid) => {
  return bid.bids.reduce((acc, subbid) => {
    const winner = subbid.data[subbid.data.length - 1].from;
    (acc[winner] = acc[winner] || []).push(subbid);
    return acc;
  }, {});
};

const addUserToActiveBids = (user_id) => {
  try {
    Object.keys(activeBids).length > 0 &&
      Object.keys(activeBids).forEach((key) => {
        const activeBid = activeBids[key];
        if (activeBid.active) {
          activeBids[key].viewers.push(user_id);
          Bid.findByIdAndUpdate(
            key,
            {
              $addToSet: {
                viewers: mongoose.Types.ObjectId(user_id),
              },
              active: true,
            },
            { new: true },
            (err, bid) => {
              if (err) res.status(500).json(err);
              //console.log('viwers modificado', bid.viewers);
            }
          );
        }
      });
  } catch (err) {
    console.log(err);
  }
};

const isAllSubbidFinished = (bid) => {
  return bid.bids.every((subbid) => subbid.finish);
};
