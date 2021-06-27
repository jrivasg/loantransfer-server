const Message = require("../Models/message.model");
const User = require("../Models/User.model");

let users = [];
let chats = [];

module.exports = function (io) {
  // Configuración de socket.io
  io.use((socket, next) => {
    const npl_id = socket.handshake.auth.npl_id;
    if (!npl_id) {
      return next(new Error("invalid id"));
    }
    socket.npl_id = npl_id;
    next();
  });

  io.on("connection", async (socket) => {
    for (let [id, socket] of io.of("/").sockets) {
      //const user = users.find((user) => user.nplID === socket.npl_id);
      const user = await User.findById(socket.handshake.auth.user_id);
      //console.log(user)
      if (user) {
        User.findByIdAndUpdate(
          user._id,
          { $set: { nplID: socket.npl_id } },
          { new: true },
          (err, user) => {
            if (err) return res.status(500).json(err);
            if (!users.find((user) => user.nplID === socket.npl_id))
              users.push(JSON.parse(JSON.stringify(user)));
            //console.log("users conected", users);
            socket.emit("user list", users);
            socket.broadcast.emit("user list", users);
          }
        );
      }
    }

    socket.on("disconnect", (reason) => {
      users = users.filter((user) => user.nplID !== socket.npl_id);
      //console.log("users tras desconexion", users);
      socket.emit("user list", users);
      socket.broadcast.emit("user list", users);
    });

    socket.on("chat message", (mssg) => {
      const chat = { mssg, nplID: socket.npl_id };
      new Message({
        text: mssg,
        from: socket.npl_id,
        time: Date.now(),
        msgType: "text",
      });
      console.log(chat);
      chats.push[chat];
      socket.emit("chat list", chat);
      socket.broadcast.emit("chat list", chat);
    });

    // These events are emitted to all the sockets connected to the same room except the sender. (VIDEO CALL)
    socket.on("start_call", (roomId) => {
      console.log(`Broadcasting start_call event to peers in room ${roomId}`);
      socket.broadcast.to(roomId).emit("start_call");
    });
    socket.on("webrtc_offer", (event) => {
      console.log(
        `Broadcasting webrtc_offer event to peers in room ${event.roomId}`
      );
      socket.broadcast.to(event.roomId).emit("webrtc_offer", event.sdp);
    });
    socket.on("webrtc_answer", (event) => {
      console.log(
        `Broadcasting webrtc_answer event to peers in room ${event.roomId}`
      );
      socket.broadcast.to(event.roomId).emit("webrtc_answer", event.sdp);
    });
    socket.on("webrtc_ice_candidate", (event) => {
      console.log(
        `Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`
      );
      socket.broadcast.to(event.roomId).emit("webrtc_ice_candidate", event);
    });
  });
};
