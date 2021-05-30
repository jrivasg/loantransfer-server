const createError = require("http-errors");
const User = require("../Models/User.model");

module.exports = {
  getAccountInfo: async (req, res, next) => {
    try {
      //console.log(req.payload);
      const user = await User.findById(req.payload.aud);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },
};
