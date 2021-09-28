const Bid = require("../../Models/bid.model");
const JWT = require("jsonwebtoken");
const { promisify } = require("util");
const client = require("../../helpers/init_redis");
const getAsyncRedis = promisify(client.get).bind(client);
var mongoose = require("mongoose");

const NEW_BID_EVENT = "newBidEvent";
const STARTING_BID = "startingBid";
const FINISHING_BID = "finishingBid";
let users = [];

let bidnsp = null;

module.exports = (io) => {
  bidnsp = io.of("bid");
  bidnsp.on("connection", async (socket) => {
    console.log(socket.id + " connected to bid socket");

    // Unimos a la sala de subastas
    const { roomId, token } = socket.handshake.query;
    const payload = await verifyAccessToken(token);
    socket.join(roomId);

    // Si hay subastas para empezar en la siguiente hora ponemos un temporizador, si hay alguna activa ya, se envía un mensaje con el id activo
    setStartTimer(io, socket.id, payload.aud);

    setFinishTimer(io, socket.id, payload.aud);

    // Listen for new bids
    socket.on(NEW_BID_EVENT, (data) => {
      // Se comprueba si la puja es valida y si lo es se guarda en el log
      saveSendLastBid(data, io, roomId, payload);
    });

    // Eventos para la desconexión
    socket.on("disconnect", (reason) => {
      socket.leave(roomId);
    });
  });
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

const saveSendLastBid = async (data, io, roomId, payload) => {
  const { bid_id, amount, subbid_id } = data.body;
  try {
    // Obtenemos la subasta y el lote, asi como su log de pujas en redis.
    const bid = await Bid.findById(bid_id).lean();
    const subbid = bid.bids.find(
      (eachbid) => String(eachbid._id) === String(subbid_id)
    );

    let lastBidRedisArray = JSON.parse(
      await getAsyncRedis(subbid_id).catch((err) => {
        if (err) console.error(err);
      })
    );
    // Obtenemos el la últimas puja
    const lastBidRedis = lastBidRedisArray[lastBidRedisArray.length - 1];

    // Si la ultima cantidad guardad no es la mismas q esta observando al pujar el cliente porque otro se haya adelantado, se desecha.
    // También se comprueba si la ultima puja fue propia para no pujar doble
    if (lastBidRedis.amount !== amount || lastBidRedis.from === payload.aud)
      return;

    // Le sumamos 2 minutos al tiempo actual de fin si quedan menos de 10 min
    let newEndDateTime = new Date(lastBidRedis.endTime);
    if (
      new Date(lastBidRedis.endTime).getTime() - new Date().getTime() <
      2 * 60 * 1000
    ) {
      newEndDateTime = new Date(
        new Date(lastBidRedis.endTime).getTime() + 1 * 60 * 1000
      );
      Bid.findByIdAndUpdate(bid_id, {
        end_time: newEndDateTime,
      });
    }

    // Creamos una nueva puja con los datos del pujador y de las cantidades y se añade al log
    const puja = {
      from: payload.aud,
      time: new Date(),
      bid_id,
      amount: lastBidRedis.amount + subbid.increment,
      subbid_id,
      active: true,
      endTime: newEndDateTime,
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

const getNextHourBids = async () => {
  const now = new Date();
  let startingMoment = new Date();
  startingMoment.setHours(now.getHours() - 2);
  let endingMoment = new Date();
  endingMoment.setHours(now.getHours() + 2);

  try {
    return await Bid.find({
      starting_time: { $gte: startingMoment, $lte: endingMoment },
    }).lean();
  } catch (err) {
    console.err(err);
  }
};

// Método que envía el mensaje de startBiding a los miembros conectados a la sala
const startBid = (subbidCurrrentResult, eachBid, io, socket_id, user_id) => {
  const now = Date.now();
  const startTime = new Date(eachBid.starting_time).getTime();
  const endTime = new Date(eachBid.end_time).getTime();
  const active = startTime < now && now < endTime;
  // Se añade al usuario a la lista de usuarios que estan presentes durante la subasta si ésta está activa. 
  if (active) {
    Bid.findByIdAndUpdate(eachBid._id, {
      $addToSet: {
        viewers: mongoose.Types.ObjectId(user_id),
      },
    }, { new: true },
      (err, bid) => {
        if (err) res.status(500).json(err);
        console.log('viwers modificado', bid.viewers)
      });
    // Se itera sobre cada lote y se comprueba se modifica la propiedad active según su fecha de inicio y fin respecto del momento actual
    const tempArray = subbidCurrrentResult.map((eachsubbid) => {
      //console.log(eachsubbid.subbid_id, startTime < now && now < endTime)
      eachsubbid.active = active;
      return eachsubbid;
    });
    //console.log('evento ' + STARTING_BID + ' enviado', tempArray)
    return bidnsp.to(socket_id).emit(STARTING_BID, tempArray)
  }
};

const setStartTimer = async (io, socket_id, user_id) => {
  // Obtenemos las subastas activas en las dos horas siguientes y previas al momento actual
  const nextHourBids = await getNextHourBids();

  // Si hay subastas en el momento actual se itera sobre ellas para obtener sus datos y enviarlas al método startBid para iniciarla
  if (nextHourBids.length > 0) {
    nextHourBids.forEach(async (eachBid) => {
      // Si queda tiempo para el inicio de la puja, se pone un temporizador y al final de la misma se envia la info sobre las pujas obtenida de redis
      // Si ya ha empezado, se busca y envia directamente la info.
      const interval = new Date(eachBid.starting_time).getTime() - Date.now();
      //console.log('interval', interval / 1000 / 60)
      if (interval > 0) {
        setTimeout(async () => {
          //console.log('Timeout ejecutado')
          // Se obtienen los lotes y se busca en redis la info de la ultima puja, o la inicial si aun no se ha iniciado
          const subbidCurrrentResult = await getSubbidCurrrentResult(eachBid);
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
  }
};

const finishBid = (subbidCurrrentResult, eachBid, io, socket_id, user_id) => {
  const now = Date.now();
  const endTime = new Date(eachBid.end_time).getTime();
  const tempArray = subbidCurrrentResult.map((eachsubbid) => {
    eachsubbid.active = now < endTime;
    eachsubbid.finish = !eachsubbid.active;
    // Acciones realizadas al finalizar un subasta
    saveFinishBidData(eachBid, eachsubbid);
    return eachsubbid;
  });

  return bidnsp.to(socket_id).emit(FINISHING_BID, tempArray);
};

const saveFinishBidData = async (eachBid, eachsubbid) => {
  try {
    const redisLog = JSON.parse(
      await getAsyncRedis(eachsubbid.subbid_id).catch((err) => {
        if (err) console.error(err);
      })
    );

    eachBid.bids[0].data.length === 0 && redisLog &&
      Bid.findByIdAndUpdate(
        eachBid._id,
        {
          finish: true,
          $set: { "bids.$[el].data": redisLog },
        },
        {
          arrayFilters: [{ "el._id": eachsubbid.subbid_id }],
          new: true,
        },
        (err, bid) => {
          if (err) res.status(500).json(err);
          console.log('eachBid._id modificado')
        }
      ).catch((err) => {
        if (err) console.error(err);
      });
  } catch (error) {
    console.log(error);
  }
};

const setFinishTimer = async (io, socket_id, user_id) => {
  // Obtenemos las subastas activas en las dos horas siguientes y previas al momento actual
  const nextHourBids = await getNextHourBids();

  if (nextHourBids.length > 0) {
    nextHourBids.forEach(async (eachBid) => {
      // Si queda tiempo para el fin de la puja, se pone un temporizador y al final del mismo se envia la info sobre el fin de la puja
      // Si ya ha finalizado, se busca y envia directamente la info.
      const interval = new Date(eachBid.end_time).getTime() - Date.now();
      //console.log('interval', interval / 1000 / 60)
      if (interval > 0) {
        //console.log('Timeout programado para dentro de ' + interval / 1000 / 60 + ' min')
        setTimeout(async () => {
          const subbidCurrrentResult = await getSubbidCurrrentResult(eachBid);
          finishBid(subbidCurrrentResult, eachBid, io, socket_id, user_id);
        }, interval);
      } else {
        // Se obtienen los lotes y se busca en redis la info de la ultima puja.
        const subbidCurrrentResult = await getSubbidCurrrentResult(eachBid);
        // Activamos cada lote para que empieze
        //console.log('puja ya comenzada')
        finishBid(subbidCurrrentResult, eachBid, io, socket_id, user_id);
      }
    });
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

const getRedisTimer = async (subbid_id) => {
  let redisSubbid = JSON.parse(
    await getAsyncRedis(subbid_id + "_timer").catch((err) => {
      if (err) console.error(err);
    })
  );
};