const mongoose = require("mongoose");
const Chat = require("../Models/chat.model");
const User = require("../Models/User.model");
const JWT = require("jsonwebtoken");
const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
let users = [];

module.exports = function (io) {
  // Configuración de socket.io
  /*  io.use((socket, next) => {
    const npl_id = socket.handshake.auth.npl_id;
    if (!npl_id) {
      return next(new Error("invalid id"));
    }
    socket.npl_id = npl_id;
    next();
  }); */

  io.on("connection", async (socket) => {
    console.log("cliente conectado => ", socket.id);
    
    // Join a conversation
    const { roomId, token } = socket.handshake.query;
    const payload = await verifyAccessToken(token);

    socket.join(roomId);
    //console.log(io.sockets.adapter.rooms.get(roomId));

    // Listen for new messages
    socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
      // Se guarda cada mensaje que se transmite a traves del socket en el objeto de la conversacion
      console.log(data);
      try {
        Chat.findOneAndUpdate(
          roomId,
          {
            $push: {
              messages: {
                text: data.body,
                from: payload.aud,
                time: Date.now(),
                msgType: "string",
              },
            },
          },
          { new: true },
          (err, doc) => {
            if (err) console.log("Error al guardar el mensaje");
            console.log(doc);
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

      // broadcast the bid to all clients
      socket.broadcast.emit("bid", socket.id + "bid: " + content["amount"]);
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
