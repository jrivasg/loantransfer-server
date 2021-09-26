const Chat = require("../../Models/chat.model");
const JWT = require("jsonwebtoken");

const NEW_NOTIFICATION_MESSAGE_EVENT = "newChatMessage";
let notificationnsp = null;

module.exports = (io) => {
  notificationnsp = io.of("chat");
  notificationnsp.on("connection", async (socket) => {
    console.log(socket.id + " connected to chat socket");

    // Unimos a la sala de chat correspondiente
    const { roomId, token } = socket.handshake.query;
    const payload = await verifyAccessToken(token);
    socket.join(roomId);

    // Listen for new Notification messages
    socket.on(NEW_NOTIFICATION_MESSAGE_EVENT, (data) => {
      // Se guarda cada mensaje que se transmite a traves del socket en el objeto de la conversacion y se emite al resto de la sala
      console.log("evento mensaje chat");
      //saveChatMessage(data, roomId, payload);
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