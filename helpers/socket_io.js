const User = require("../Models/User.model");
const Chat = require("../Models/chat.model");

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
    console.log('cliente conectado => ', socket.id);
    // Asociamos el id de socket al usuario
    // Join a conversation
    const { roomId, token } = socket.handshake.query;

    socket.join(roomId);
    console.log(io.sockets.adapter.rooms.get("chat_id"));

    // Listen for new messages
    socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
      // Guardar en db cada mensaje que llegue
      io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
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

   /* socket.on("chat message", (mssg) => {
      console.log(mssg);
      const { message, chat_id } = mssg;
      const tempMessage = {
        text: message,
        from: getSenderId(),
        time: Date.now(),
        msgType: "text",
      };

      Chat.findByIdAndUpdate(
        chat_id,
        {
          $push: {
            messages: tempMessage,
          },
        },
        { new: true },
        (err, chat) => {
          if (err) console.log(err);
          // Se manda el mensaje al destinatario
          const receptor = chat.users.filter(
            (userfromarray) => userfromarray.user_id !== user._id
          )[0];
          const receptorSocket = users.find(
            (user) => user.user_id === receptor.user_id
          );
          if (receptorSocketId)
            socket.broadcast
              .to(receptorSocketId.socket_id)
              .emit("chat message", tempMessage);
        }
      );
      console.log(message);
      socket.broadcast.to(socket.id).emit("chat message", message);
    });*/

    // eventos para las pujas
    socket.on("bid", function (content) {
      const tempBid = {};

      socket.emit("bid", content["amount"]);

      // broadcast the bid to all clients
      socket.broadcast.emit("bid", socket.id + "bid: " + content["amount"]);
    });

  });
};

const getSenderId = (socket_id) => {
  const user = users.find((user) => user.socket_id === socket_id)[0];
  return user.user_id;
};
