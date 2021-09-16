const mongoose = require("mongoose");
const Chat = require("../Models/chat.model");
const Bid = require("../Models/bid.model");
const JWT = require("jsonwebtoken");
const { promisify } = require("util");
const client = require("../helpers/init_redis");
const getAsyncRedis = promisify(client.get).bind(client);

const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
const NEW_BID_EVENT = "newBidEvent";
const STARTING_BID = "startingBid";
let users = [];

module.exports = (io) => {
  io.on("connection", async (socket) => {
    console.log("cliente conectado => ", socket.id);
    // Conexión y unión del cliente a la sala
    const { roomId, token } = socket.handshake.query;
    const payload = await verifyAccessToken(token);
    socket.join(roomId);

    // Si hay subastas para empezar en la siguiente hora ponemos un temporizador, si hay alguna activa ya, se envía un mensaje con el id activo
    setTimer(io, socket.id);

    // Listen for new CHAT messages
    socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
      // Se guarda cada mensaje que se transmite a traves del socket en el objeto de la conversacion y se emite al resto de la sala
      saveChatMessage(data, io, roomId, payload);
    });

    // Listen for new bids
    socket.on(NEW_BID_EVENT, (data) => {
      // Se comprueba si la puja es valida y si lo es se guarda en el log
      saveSendLastBid(data, io, roomId, payload)
    });

    // Leave the room if the user closes the socket
    socket.on("disconnect", () => {
      socket.leave(roomId);
    });

    // eventos para el chat
    socket.on("disconnect", (reason) => {
      users = users.filter((user) => user.socket_id !== socket.id);
      //console.log("users tras desconexion", users);
      socket.emit("user list", users);
      socket.broadcast.emit("user list", users);
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

const saveChatMessage = (data, io, roomId, payload) => {
  const message = {
    text: data.body.text,
    from: payload.aud,
    time: Date.now(),
    msgType: data.body.type,
    doc_id: data.body.doc_id || null,
    mimetype: data.body.mimetype || null,
  };

  try {
    Chat.findByIdAndUpdate(
      roomId,
      {
        $push: {
          messages: message,
        },
      },
      { new: true },
      (err, doc) => {
        if (err) console.log("Error al guardar el mensaje");
        //console.log(doc);
      }
    );
  } catch (error) {
    console.log(error);
  }
  io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, message);
}

const saveSendLastBid = async (data, io, roomId, payload) => {
  const { bid_id, amount, subbid_id } = data.body;

  try {
    const bid = Bid.findById(bid_id, 'bids').lean();
    console.log(bids)
  } catch (error) {
    console.log(error);
  }

  // Se crea el objeto puja
  let puja = {
    from: payload.aud,
    time: new Date(),
    bid_id,
    amount: null,
    subbid_id,
  };;

  try {
    // Obtenemos el historico para esa venta
    let bidLog = JSON.parse(await getAsyncRedis(subbid_id).catch((err) => {
      if (err) console.error(err)
    }));
    console.log(`${subbid_id}-log`, bidLog);

    // Se calcula la nueva cantidad sumando cantidades fijas según incrementos
    if (bidLog) {
      puja.amount = Number(bidLog[bidLog.length - 1].amount) + 500;
    } else {
      puja.amount = 500;
    }

    // Se añade la puja al log de la subasta
    client.SET(subbid_id, JSON.stringify(puja), (err, reply) => {
      if (err) {
        console.log(err.message);
        //createError.InternalServerError();
      }
      console.log("Puja Guardada");
    });

    // Se reenvía la última puja a todos los clientes del socket
    puja.active = true;
    io.in(roomId).emit(NEW_BID_EVENT, puja);
  } catch (error) {
    console.log(error);
  }
}

const getActiveBids = async () => {
  const now = new Date();
  let startingMoment = new Date();
  startingMoment.setDate(now.getHours() + 1);

  try {
    return await Bid.find({ starting_time: { $gte: now, $lte: startingMoment } }).lean();
  } catch (err) {
    console.err(err)
  }
}

const setTimer = async (io, socket_id) => {
  const activeBids = await getActiveBids();
  const startBid = (eachBid) => {
    return io.to(socket_id).emit(STARTING_BID, { bid_id: eachBid._id, active: true });
  }
  console.log("activeBids", activeBids);
  if (activeBids.length > 0) {
    activeBids.forEach(eachBid => {
      let now = Date.now() + 2 * 60 * 60 * 1000;
      const interval = new Date(eachBid.starting_time).getTime() - now;
      if (interval > 0) {
        setInterval(() => {
          startBid(eachBid, io);
        }, interval);
      } else {
        startBid(eachBid, io);
      }
    });
  }
}

const setTimer_prueba = async (io, socket_id) => {
  const activeBids = await getActiveBids();
  const sendBidInfo = (eachBid) => {
    return io.to(socket_id).emit(STARTING_BID, { bid_id: eachBid._id, active: true });
  }
  if (activeBids.length > 0) {
    activeBids.forEach(eachBid => {
      let now = Date.now() + 2 * 60 * 60 * 1000;
      const interval = new Date(eachBid.starting_time).getTime() - now;
      if (interval > 0) {
        setInterval(() => {
          sendBidInfo(eachBid, io);
        }, interval);
      } else {
        sendBidInfo(eachBid, io);
      }
    });
  }
}