const createError = require("http-errors");
const Chat = require("../Models/Chat.model");
const User = require("../Models/User.model");
const Message = require("../Models/Message.model");

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
};
