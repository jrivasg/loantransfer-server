const Chat = require("../../Models/chat.model");
const JWT = require("jsonwebtoken");
const aws_email = require("../../helpers/aws_email");
const User = require("../../Models/User.model");
const { getHtmltoSend } = require("../../Templates/useTemplate");
const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
let chatnsp = null;
const messageQueu = {};

module.exports = (io) => {
  chatnsp = io.of("chat");
  chatnsp.on("connection", async (socket) => {
    console.log(socket.id + " connected to chat socket");

    // Unimos a la sala de chat correspondiente
    const { roomId, token } = socket.handshake.query;
    const payload = await verifyAccessToken(token);
    socket.join(roomId);
    messageQueu[roomId] = true;

    // Listen for new CHAT messages
    socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
      // Se guarda cada mensaje que se transmite a traves del socket en el objeto de la conversacion y se emite al resto de la sala
      console.log("evento mensaje chat");
      saveChatMessage(data, roomId, payload);
      addMessageToQueu(data, roomId, payload);
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
  const { text, type, doc_id, mimetype } = data.body;

  const message = {
    text: text,
    from: payload.aud,
    time: Date.now(),
    msgType: type,
    doc_id: doc_id || null,
    mimetype: mimetype || null,
  };

  chatnsp.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, message);

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
        if (err) console.log("Error al guardar el mensaje", err);
        //console.log(doc);
      }
    );
  } catch (error) {
    console.log(error);
  }
};

const addMessageToQueu = (data, roomId, payload) => {
  if (messageQueu[roomId]) {
    sendEmailAlert(data, roomId, payload);
    setTimeout(() => {
      messageQueu[roomId] = true;
    }, 60 * 60 * 1000);
  }
};

const sendEmailAlert = async (data, roomId, payload) => {
  const { displayName, company } = await User.findById(payload.aud).lean();
  const message = `${displayName} de la compañía ${company} le ha enviado un mensaje, para seguir con la conversación en nuestra plataforma acceda al chat en el siguiente link`;
  const { users } = await Chat.findByIdAndUpdate(roomId).lean();
  const receiver = users.filter(
    (user) => String(user.user_id) !== String(payload.aud)
  )[0];
  const { email } = await User.findById(receiver.user_id).lean();

  const email_message = getHtmltoSend(
    "../Templates/chat/message_recived_template.hbs",
    {
      message,
      url: `https://app.loan-transfer.com/app/chat/${roomId}`,
      displayName,
      company,
    }
  );
  const email_subject = "LoanTransfer - Un usaurio desea comunicarse con usted";
  const emailSentInfo = await aws_email.sendEmail(
    email,
    email_subject,
    email_message,
    "logo_loan_transfer.png"
  );

  emailSentInfo.accepted.length > 0 && (messageQueu[roomId] = false);
  console.log("Email de chat recibido enviado a ", emailSentInfo.accepted);
};
