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

  createUSer: async (req, res, next) => {
    try {
      const response = req.body;
      new User(response).save((err, user) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }
        res.status(200).json(user);
      });
    } catch (error) {
      next(error);
    }
  },
};
