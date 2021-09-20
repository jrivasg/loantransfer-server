const mongoose = require("mongoose");
const Chat = require("../Models/chat.model");
const Bid = require("../Models/bid.model");
const JWT = require("jsonwebtoken");
const { promisify } = require("util");
const client = require("../helpers/init_redis");
const getAsyncRedis = promisify(client.get).bind(client);

const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
const NEW_BID_EVENT = "newBidEvent";
const CURRENT_AMOUNT = "currentAmount";
const STARTING_BID = "startingBid";
let users = [];
let currentActiveBid = {};

module.exports = (io) => {
  io.on("connection", async (socket) => {
    console.log("cliente conectado => ", socket.id);
    // Join a conversation
    const { roomId, token } = socket.handshake.query;
    const payload = await verifyAccessToken(token);
    socket.join(roomId);

    // Si el cliente se ha conectado a la pagina de subastas se le añade a al array de usuarios
    if (roomId === 'bidding') users.push({ user_id: payload.aud, bid_id: roomId });
    // TODO al finalizar la subasta vaciar el array y guardarlo en db

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
    const bid = Bid.findById(bid_id).lean();
    //console.log(bid)
    /* const subbid = bid.bids.find(eachbid => String(eachbid.subbid_id) === String(subbid_id));
    console.log(subbid) */
    /*  Bid.findByIdAndUpdate(
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
     ); */
  } catch (error) {
    console.log(error);
  }

  let puja;

  let lastBidRedis = JSON.parse(await getAsyncRedis(subbid_id).catch((err) => {
    if (err) console.error(err)
  }));
  console.log('lastbid', lastBidRedis?.amount)

  let tempAmount = 0;
  if (lastBidRedis) {
    tempAmount = Number(lastBidRedis.amount) + 500
  } else {
    tempAmount = 500
  }

  puja = {
    from: payload.aud,
    time: new Date(),
    bid_id,
    amount: tempAmount,
    subbid_id,
    active: true
  };

  client.SET(subbid_id, JSON.stringify(puja), "EX", 10 * 180, (err, reply) => {
    if (err) {
      console.log(err.message);
      //createError.InternalServerError();
    }
    console.log("Puja Guardada");
  });

  io.in(roomId).emit(NEW_BID_EVENT, puja);
  //}
}

const getNextHourBids = async () => {
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
  const activeBids = await getNextHourBids();
  const startBid = (eachBid) => {
    return io.to(socket_id).emit(STARTING_BID, { bid_id: eachBid._id, active: true });
  }
  if (activeBids.length > 0) {
    activeBids.forEach(eachBid => {
      let now = Date.now() + 2 * 60 * 60 * 1000;
      const interval = new Date(eachBid.starting_time).getTime() - now;
      if (interval > 0) {
        setTimeout(startBid(eachBid, io), interval);
      } else {
        startBid(eachBid);
      }
    });
  }
}