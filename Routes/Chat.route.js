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
};
