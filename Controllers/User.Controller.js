const createError = require("http-errors");
const User = require("../Models/User.model");
const aws_email = require("../helpers/aws_email");
const { getHtmltoSend } = require("../Templates/useTemplate");

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
      new User(response).save(async (err, user) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }

        const email_message = getHtmltoSend(
          "../Templates/auth/singup_template.hbs",
          {}
        );
        const email_subject = "Ha sido dado de alta en LOAN TRANSFER";
        const emailinfo = await aws_email.sendEmail(
          user.email,
          email_subject,
          email_message,
          "logo_loan_transfer.png"
        );

        console.log(emailinfo.accepted)
        res.status(200).json(user);
      });
    } catch (error) {
      next(error);
    }
  },
};
