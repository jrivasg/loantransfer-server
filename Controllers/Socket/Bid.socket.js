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
    const {displayName, company} = await User.findById(payload.aud).select('displayName company').lean()
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
      // Comprobamos si tiene algun timer programado y lo eliminamos
      activeUsers[payload.aud].startTimer &&
        clearTimeout(activeUsers[payload.aud].startTimer);
      // Eliminamos el usuario del objeto de usuarios activos
      delete activeUsers[payload.aud];
    });

    // Si hay subastas para empezar en la siguiente hora ponemos un temporizador,
    // si hay alguna activa ya, se envía un mensaje con el id activo
    const nextHourBids = await getNextHourBids();
    if (nextHourBids.length > 0) {
      setStartTimer(io, socket.id, payload.aud, nextHourBids);
      setFinishTimer(roomId, nextHourBids);
    }
  });
};

const saveSendLastBid = async (data, roomId, payload) => {
  const { bid_id, amount, subbid_id } = data.body;

  try {
    // Obtenemos la subasta y el lote, asi como su log de pujas en redis.
    let lastBidRedisArray = JSON.parse(
      await getAsyncRedis(subbid_id).catch((err) => {
        if (err) console.error(err);
      })
    );

    // Obtenemos la últimas puja
    const lastBidRedis = lastBidRedisArray[lastBidRedisArray.length - 1];

    // Si la ultima cantidad guardada no es la mismas q esta observando al pujar el cliente porque otro se haya adelantado, se desecha.
    // También se comprueba si la ultima puja fue propia para no pujar doble
    if (lastBidRedis.amount === amount || lastBidRedis.from === payload.aud)
      return;

    // Le sumamos 30 segundos al tiempo actual de fin si quedan menos de 1 min
    let endDateTime = new Date(activeBids[bid_id].endTime);
    let now = new Date();
    let newEndDateTime;

    if (endDateTime.getTime() - now.getTime() < 1 * 60 * 1000) {
      newEndDateTime = new Date(endDateTime.getTime() + 30 * 1000);

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
          setFinishTimer(roomId, [jsonBid], newEndDateTime);
        }
      );
    }

    // Creamos una nueva puja con los datos del pujador y de las cantidades y se añade al log
    const puja = {
      from: payload.aud,
      name: `${activeUsers[payload.aud].displayName} de ${activeUsers[payload.aud].company}`,
      time: new Date(),
      bid_id,
      amount: amount, // nextAmount
      subbid_id,
      active: true,
      endTime: newEndDateTime ?? endDateTime,
    };

    lastBidRedisArray.push(puja);

    // Se guarda de nuevo el log en redis
    client.SET(subbid_id, JSON.stringify(lastBidRedisArray), (err, reply) => {
      if (err) console.log(err.message);
    });

    // Calculamos el nuevo tiempo de fin para mandarlo en el evento puja
    puja.endTime = new Date(puja.endTime).getTime() - new Date().getTime();

    bidnsp.in(roomId).emit(NEW_BID_EVENT, puja);
  } catch (error) {
    console.log(error);
  }
};

const setStartTimer = async (io, socket_id, user_id, nextHourBids) => {
  // Antes de programar un timer se comprueba q no exista otro, o se borra
  activeUsers[user_id].startTimer &&
    clearTimeout(activeUsers[user_id].startTimer);
  // Se itera sobre ellas para obtener sus datos y enviarlas al método startBid para iniciarla
  nextHourBids.forEach(async (eachBid) => {
    // Si queda tiempo para el inicio de la puja, se pone un temporizador y al final de la misma se envia la info sobre las pujas obtenida de redis
    // Si ya ha empezado, se busca y envia directamente la info.
    const interval = new Date(eachBid.starting_time).getTime() - Date.now();
    //console.log('interval', interval / 1000 / 60)
    if (interval > 0) {
      const startTimer = setTimeout(async () => {
        //console.log('Timeout ejecutado')
        // Se obtienen los lotes y se busca en redis la info de la ultima puja, o la inicial si aun no se ha iniciado
        const subbidCurrrentResult = await getSubbidCurrrentResult(eachBid);
        activeUsers[user_id].startTimer = startTimer;
        startBid(subbidCurrrentResult, eachBid, io, socket_id, user_id);
      }, interval);
    } else {
      // Se obtienen los lotes y se busca en redis la info de la ultima puja, o la inicial si aun no se ha iniciado
      const subbidCurrrentResult = await getSubbidCurrrentResult(eachBid);
      // Activamos cada lote para que empieze
      //console.log('puja ya comenzada')
      startBid(subbidCurrrentResult, eachBid, io, socket_id, user_id);
    }
  });
};

// Método que envía el mensaje de startBiding a los miembros conectados a la sala
const startBid = (subbidCurrrentResult, eachBid, io, socket_id, user_id) => {
  const now = Date.now();
  const startTime = new Date(eachBid.starting_time).getTime();
  const endTime = activeBids[eachBid._id]?.endTime
    ? activeBids[eachBid._id].endTime.getTime()
    : new Date(eachBid.end_time).getTime();
  const active = startTime < now && now < endTime;

  // Se añade al usuario a la lista de usuarios que estan presentes durante la subasta si ésta está activa.
  if (active) {
    Bid.findByIdAndUpdate(
      eachBid._id,
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
    // Se itera sobre cada lote y se comprueba se modifica la propiedad active según su fecha de inicio
    // y fin respecto del momento actual, para mandar por el socket
    const tempArray = subbidCurrrentResult.map((eachsubbid) => {
      eachsubbid.active = active;
      eachsubbid.endTime = new Date(endTime).getTime() - new Date().getTime();
      return eachsubbid;
    });

    return bidnsp.to(socket_id).emit(STARTING_BID, tempArray);
  }
};

const setFinishTimer = async (room_id, nextHourBids, newEndDateTime = null) => {
  nextHourBids.forEach(async (eachBid) => {
    // Se crea el objeto subastra activa si no existe para esta
    !activeBids[eachBid._id] &&
      (activeBids[eachBid._id] = { endTime: eachBid.end_time });

    // Si se va a extender el timer se borra el anterior
    newEndDateTime && clearTimeout(activeBids[eachBid._id].finishTimer);

    // Si queda tiempo para el fin de la puja, se pone un temporizador y al final del mismo se envia la info sobre el fin de la puja
    // Si ya ha finalizado, se busca y envia directamente la info.
    const interval = newEndDateTime
      ? newEndDateTime.getTime() - Date.now()
      : new Date(eachBid.end_time).getTime() - Date.now();

    if (!activeBids[eachBid._id]?.finishTimer || newEndDateTime) {
      if (interval > 0) {
        // Se guarda en memoria la fecha en la que termina la subasta si hay una nueva
        newEndDateTime && (activeBids[eachBid._id].endTime = newEndDateTime);

        // Programamos el timer
        const finishTimerId = setTimeout(() => {
          finishBid(eachBid, room_id);
        }, interval);
        // Guardamos la referencia del timer para borrarlo en caso de tener que extenderlo
        activeBids[eachBid._id].finishTimer = finishTimerId;
        console.log(
          "Subasta finaliza en ",
          minTommss(activeBids[eachBid._id].finishTimer._idleTimeout / 60000)
        );
      }
    }
  });
};

const finishBid = async (eachBid, room_id) => {
  try {
    Bid.findByIdAndUpdate(
      eachBid._id,
      {
        active: false,
        finish: true,
      },
      (err, bid) => {
        if (err) res.status(500).json(err);
      }
    ).catch((err) => {
      if (err) console.error(err);
    });
  } catch (error) {
    console.log(error);
  }

  let subbidCurrrentResult = await getSubbidCurrrentResult(eachBid);

  const tempArray = subbidCurrrentResult.map((eachsubbid) => {
    // Se guarda la información de la cartera: Historial de apuestas y de clientes conectados
    saveFinishBidData(eachBid, eachsubbid);
    eachsubbid.finish = true;
    eachsubbid.active = false;
    eachsubbid.endTime = 0;
    return eachsubbid;
  });

  // Eliminamos el objeto de la puja al finalizar
  delete activeBids[eachBid._id];
  console.log("Subasta finalizada");

  setTimeout(() => {
    return bidnsp.in(room_id).emit(FINISHING_BID, tempArray);
  }, 1000);
  
};

const saveFinishBidData = async (eachBid, eachsubbid) => {
  try {
    const redisLog = JSON.parse(
      await getAsyncRedis(eachsubbid.subbid_id).catch((err) => {
        if (err) console.error(err);
      })
    );
    const lastBid = redisLog[redisLog.length - 1];
    // Para evitar procesos duplicados solo guarda la información de cada lote el ganador
    eachBid.bids[0].data.length === 0 &&
      redisLog &&
      Bid.findOneAndUpdate(
        {
          _id: eachBid._id,
        },
        {
          $set: {
            "bids.$[el].data": redisLog,
            "bids.$[el].buyer": lastBid.from,
            "bids.$[el].finalAmount": lastBid.amount,
          },
        },
        {
          arrayFilters: [{ "el._id": eachsubbid.subbid_id }],
          new: true,
        },
        async (err, bid) => {
          if (err) res.status(500).json(err);
          let jsonBid = JSON.parse(JSON.stringify(bid));
          const lote = jsonBid.bids.find(
            (lote) => String(lote._id) === String(eachsubbid.subbid_id)
          );
          sendWinnerEmail(jsonBid, lote, lastBid.from);
        }
      ).catch((err) => {
        if (err) console.error(err);
      });
  } catch (error) {
    console.log(error);
  }
};

// Se itera sobre los diferentes lotes y se obtiene la info de las pujas de redis
const getSubbidCurrrentResult = async (eachBid) => {
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
          active: false,
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
    //console.log('redisSubbid', redisSubbid);
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

const sendWinnerEmail = async (eachBid, subbid, user_id) => {
  // Obtención de datos para envío de nueva y subasta y programar envío de recordatorio
  const company = await User.findById(eachBid.seller).select("company");
  const winner = await User.findById(String(user_id)).lean();

  const email_message = getHtmltoSend(
    "../Templates/bid/bid_winner_template.hbs",
    {
      bid: eachBid,
      subbid: subbid,
      subbid_id: String(subbid._id).slice(-6),
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
};

function minTommss(minutes) {
  var sign = minutes < 0 ? "-" : "";
  var min = Math.floor(Math.abs(minutes));
  var sec = Math.floor((Math.abs(minutes) * 60) % 60);
  return sign + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
}
