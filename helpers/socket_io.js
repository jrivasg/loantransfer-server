const mongoose = require("mongoose");
const Chat = require("../Models/chat.model");
const User = require("../Models/User.model");
const JWT = require("jsonwebtoken");
const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
const NEW_BID_EVENT = "newBidEvent";
let users = [];

module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("cliente conectado => ", socket.id);

    // Join a conversation
    const { roomId, token } = socket.handshake.query;
    //console.log(socket.handshake.query);
    const payload = await verifyAccessToken(token);

    socket.join(roomId);
    //console.log(io.sockets.adapter.rooms.get(roomId));

    // Listen for new messages
    socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
      // Se guarda cada mensaje que se transmite a traves del socket en el objeto de la conversacion
      console.log("mensaje entrante", data);
    
      try {
        Chat.findByIdAndUpdate(
          roomId,
          {
            $push: {
              messages: {
                text: data.body.text,
                from: payload.aud,
                time: Date.now(),
                msgType: data.body.type,
                doc_id: data.body.doc_id || null,
                mimetype: data.body.mimetype || null
              },
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
      io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, {
        text: data.body,
        from: payload.aud,
        time: Date.now(),
        msgType: "string",
      });
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

    // eventos para las pujas
    socket.on("bid", (content) => {
      const tempBid = {};

      socket.emit("bid", content["amount"]);

      io.in(roomId).emit(NEW_BID_EVENT, {
        amount: data.body,
        from: payload.aud,
        time: Date.now(),
      });
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
