router.post("/signin", AuthController.signin);
const express = require("express");
const router = express.Router();

module.exports = {
  addMesagge: async (req, res, next) => {
    try {
      //console.log(req.payload);
      const user = await User.findById(req.body.user_id);
      const chat = await Chat.findById(req.body.user_id);
      const Message = await User.findById(req.body.user_id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },
  getChat: async (req, res, next) => {
    const { user_id, chat_id } = req.body;
    //console.log(req.payload);
    try {
      // Comprobamos si tiene un chat con esa persona
      const chat = await Chat.findById(req.body.chat_id);
      const Message = await User.findById(req.body.user_id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },
};
