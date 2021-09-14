const mongoose = require("mongoose");
const Chat = require("../Models/chat.model");
const Bid = require("../Models/bid.model");
const JWT = require("jsonwebtoken");
const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
const NEW_BID_EVENT = "newBidEvent";
const CURRENT_AMOUNT = "currentAmount";
let users = [];
let winningAmount = 50;

module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("cliente conectado => ", socket.id);

    // Join a conversation
    const { roomId, token } = socket.handshake.query;
    const payload = await verifyAccessToken(token);
    socket.join(roomId);

    // Enviamos el valor actual de cada puja abierta de la puja
    if (roomId === 'bidding') {

      io.to(socket.id).emit(CURRENT_AMOUNT, { amount: winningAmount });
    }


    // Listen for new CHAT messages
    socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
      // Se guarda cada mensaje que se transmite a traves del socket en el objeto de la conversacion
      //console.log("mensaje entrante", data);
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
      data.from = payload.aud;
      io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, message);
    });

    // Listen for new CHAT messages
    socket.on(NEW_BID_EVENT, async (data) => {
      // Se guarda cada mensaje que se transmite a traves del socket en el objeto de la conversacion
      const { bid_id, amount, subbid_id } = data.body;
      console.log("puja", data);
      let puja;
      if (amount > winningAmount) {
        winningAmount += amount;

        puja = {
          from: payload.aud,
          time: Date.now(),
          bid_id,
          amount,
          subbid_id,
        };

        try {
          const tempbid = await Bid.findById(bid_id).lean();
          const tempsubbid = tempbid.bids.find(subbid => String(subbid._id) === String(subbid_id));



          io.in(roomId).emit(NEW_BID_EVENT, puja);
        } catch (error) {
          console.log(error);
        }
      }
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
