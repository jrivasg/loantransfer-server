const Chat = require("../../Models/chat.model");
const JWT = require("jsonwebtoken");

const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
let chatnsp = null;

module.exports = (io) => {
  chatnsp = io.of("chat");  
  chatnsp.on("connection", async (socket) => {
    console.log(socket.id + " connected to chat socket");

    // Unimos a la sala de chat correspondiente
    const { roomId, token } = socket.handshake.query;
    const payload = await verifyAccessToken(token);
    socket.join(roomId);

    // Listen for new CHAT messages
    socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
      // Se guarda cada mensaje que se transmite a traves del socket en el objeto de la conversacion y se emite al resto de la sala
      console.log("evento mensaje chat");
      saveChatMessage(data, roomId, payload);
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

const saveChatMessage = (data, roomId, payload) => {
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
  chatnsp.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, message);
};
