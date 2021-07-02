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
    console.log('cliente conectado => ', socket.id)
    // Join a conversation
    const { roomId } = socket.handshake.query;
    socket.join(roomId);
    console.log(io.sockets.adapter.rooms.get("chat_id"));

    // Listen for new messages
    socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
      io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
    });

    // Leave the room if the user closes the socket
    socket.on("disconnect", () => {
      socket.leave(roomId);
    });
    /*let user;
    console.log("usuario conectado => ", socket.id);
    for (let [id, socket] of io.of("/").sockets) {
      try {
        /*  user = await User.findById(socket.handshake.auth.user_id);
        //console.log(user)
        if (user) {
          User.findByIdAndUpdate(
            user._id,
            { $set: { socket_id: socket.id } },
            { new: true },
            (err, user) => {
              if (err) return res.status(500).json(err);
              // añade al usuario al array de usuarios y se manda la lista a todos los usuarios conectados
              //console.log(user)
              if (!users.find((user) => user.socket_id === socket.id))
                users.push({
                  displayName: user.displayName,
                  socket_id: user.socket_id,
                  user_id: user._id,
                });
              //console.log("users conected", users);
              socket.emit("user list", users);
              socket.broadcast.emit("user list", users);
            }
          );
        } 
        if (!users.find((user) => user.socket_id === socket.id))
          users.push({
            //displayName: user.displayName,
            socket_id: socket.id,
            //user_id: user._id,
          });
      } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error });
      }
    }

    socket.broadcast.emit("conectado", "estas conectado");
    console.log("users conected", users);



    // eventos para el chat
    socket.on("disconnect", (reason) => {
      users = users.filter((user) => user.socket_id !== socket.id);
      //console.log("users tras desconexion", users);
      socket.emit("user list", users);
      socket.broadcast.emit("user list", users);
    });

    socket.on("chat message", (mssg) => {
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
    });

    // eventos para las pujas
    socket.on("bid", function (content) {
      const tempBid = {};

      socket.emit("bid", content["amount"]);

      // broadcast the bid to all clients
      socket.broadcast.emit("bid", socket.id + "bid: " + content["amount"]);
    });
*/
  });
};

const getSenderId = (socket_id) => {
  const user = users.find((user) => user.socket_id === socket_id)[0];
  return user.user_id;
};
