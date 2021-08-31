const createError = require("http-errors");
const Chat = require("../Models/chat.model");
const User = require("../Models/User.model");
const Message = require("../Models/message.model");

module.exports = {
  saveMessage: async (req, res, next) => {
    const { user_id, chat, message } = req.body;
    try {
      //console.log(req.payload);
      const user = await User.findById(req.body.user_id);
      const chat = user.chat.find();
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },
  getChats: async (req, res, next) => {
    try {
      //console.log(req.payload);
      const user = await User.findById(req.payload.aud).populate("chat").lean();
      res.status(200).json(user.chat);
    } catch (error) {
      next(error);
    }
  },
  createChat: async (req, res, next) => {
    try {
      const user = await User.findById(req.payload.aud).populate("chat").lean();
      const invitedUser = await User.findById(req.body.user_id).lean();

      // si el usuario ya tiene un chat con el otro usuario seleccionado se devuelve el id del chat
      const chats = await Chat.find({
        users: { $elemMatch: { user_id: user._id } },
      });

      let tempChat;
      chats.forEach((chat) => {
        if (
          chat.users.some((e) => String(e.user_id) === String(invitedUser._id))
        )
          tempChat = chat;
      });

      if (tempChat) return res.status(200).json(tempChat._id);

      // Se crea el chat si no existe alguno entre ambos usuarios
      if (user && invitedUser)
        new Chat({
          users: [
            {
              user_id: user._id,
              displayName: user.displayName,
            },
            {
              user_id: invitedUser._id,
              displayName: invitedUser.displayName,
            },
          ],
          messages: [],
        }).save((err, chat) => {
          if (err) return res.status(500).json(err);
          // Modificamos os usuarios para añadir el id del chat a sus arrays de chats
          User.findByIdAndUpdate(
            invitedUser._id,
            { $push: { chat: chat._id } },
            (err, doc) => {
              if (err) return res.json(500).json(err);

              User.findByIdAndUpdate(
                user._id,
                { $push: { chat: chat._id } },
                { new: true },
                (err, originalUser) => {
                  if (err) return res.json(500).json(err);
                  // Añadimos el chat al usuario previamente encontrado y se devuelve el array
                  user.chat.push(chat);
                  res.status(200).json(chat._id);
                }
              );
            }
          );
        });
    } catch (error) {
      next(error);
    }
  },
};
