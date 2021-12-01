const OTP = require("../Models/OTP.model");
const { encode, decode } = require("../helpers/crypt");
var otpGenerator = require("otp-generator");
const { send } = require("../helpers/sendEmail");
const client = require("../helpers/init_redis");
const User = require("../Models/User.model");
const { getHtmltoSend } = require("../Templates/useTemplate");
const { sendEmail } = require("../helpers/aws_email");

module.exports = {
  sendEmail: async (req, res, next) => {
    //console.log(req.body)
    try {
      const { email, type } = req.body;
      let email_subject, email_message;
      if (!email) return res.status(400).send({ error: "Email no recibido" });

      if (!type) return res.status(400).send({ error: "tipo no recibido" });

      const user = await User.findOne({ email: email }, '_id')
      //console.log('userId', user._id)
      // Generate OTP
      const otp = otpGenerator.generate(6, {
        alphabets: false,
        upperCase: false,
        specialChars: false,
      });
      const now = new Date();
      const expiration_time = Date.now() + (1000 * 60 * 10);

      // Create OTP instance in DB
      const otpEl = {
        otp: otp,
        expiration_time: expiration_time,
      };
      client.SET(user._id ? String(user._id) : 'userID', JSON.stringify(otpEl), "EX", 10 * 60, (err, reply) => {
        if (err) {
          console.log(err.message);
          //createError.InternalServerError();
          return;
        }
        //console.log("OTP guardado en DB");
      });

      // Create details object containing the email and otp id
      var details = {
        timestamp: now,
        check: email,
        success: true,
        message: "OTP sent to user",
        otp_id: otpEl._id,
      };

      // Encrypt the details object
      const encoded = await encode(JSON.stringify(details));

      //Choose message template according type requestedconst encoded= await encode(JSON.stringify(details))
      if (type) {
        if (type == "VERIFICATION") {
          const {
            message,
            subject_mail,
          } = require("../Templates/auth/email_verification");
          email_message = message(otp);
          email_subject = subject_mail;
        } else if (type == "FORGET") {
          const {
            message,
            subject_mail,
          } = require("../Templates/auth/email_forget");
          email_message = message(otp);
          email_subject = subject_mail;
        } else if (type == "2FA") {
          email_message = getHtmltoSend("../Templates/auth/2FA_template.hbs", {
            otp,
          });
          email_subject = "Codigo de confirmación inicio de sesión";
        } else {
          return res.status(400).send({ error: "Tipo incorrecto recibido" });
        }
      }
      sendEmail(email, email_subject, email_message);
      res.status(200).send({ message: 'Email envido', verification_key: encoded });
    } catch (err) {
      return res.status(400).send({ error: err.message });
    }
  },
  verify: async (req, res, next) => {
    try {
      var currentdate = new Date();
      const { verification_key, otp, email } = req.body;
      //console.log(req.body);
      const user = await User.findOne({ email: email }, '_id')
      //console.log(user)
      if (!verification_key) {
        const response = {
          Status: "Failure",
          Details: "Verification Key not provided",
        };
        return res.status(400).send(response);
      }
      if (!otp) {
        const response = { Status: "Failure", Details: "OTP not Provided" };
        return res.status(400).send(response);
      }
      if (!email) {
        const response = { Status: "Failure", Details: "Check not Provided" };
        return res.status(400).send(response);
      }

      let decoded;

      //Check if verification key is altered or not and store it in variable decoded after decryption
      try {
        decoded = await decode(verification_key);
      } catch (err) {
        const response = {
          Status: "Failure",
          Details: "Bad Request - decoding key",
        };
        return res.status(400).send(response);
      }

      var obj = JSON.parse(decoded);
      const check_obj = obj.check;

      // Check if the OTP was meant for the same email or phone number for which it is being verified
      if (check_obj != email) {
        const response = {
          Status: "Failure",
          Details: "OTP was not sent to this particular email or phone number",
        };
        return res.status(400).send(response);
      }

      // TODO llamar a REDIS
      client.GET(String(user._id), (err, result) => {
        if (err) {
          console.log(err.message);
          //reject(createError.InternalServerError());
          return;
        }
        const otp_instance = JSON.parse(result);
        //console.log('otp_instance', otp_instance);
        //Check if OTP is available in the DB
        if (otp_instance != null) {
          //Check if OTP is already used or not
          if (otp_instance.verified != true) {
            //Check if OTP is expired or not
            if (otp_instance.expiration_time > Date.now()) {
              //Check if OTP is equal to the OTP in the DB
              if (otp === otp_instance.otp) {
                // Mark OTP as verified or used
                otp_instance.verified = true;
                //otp_instance.save();

                const response = {
                  Status: "Success",
                  Details: "Código de verificación correcto",
                  email: email,
                };
                req.payload = response
                //console.log(response)
                next()
              } else {
                const response = {
                  Status: "Failure",
                  Details: "El código no es correcto",
                };
                return res.status(400).send(response);
              }
            } else {
              const response = { Status: "Failure", Details: "OTP Expired" };
              return res.status(400).send(response);
            }
          } else {
            const response = { Status: "Failure", Details: "OTP Already Used" };
            return res.status(400).send(response);
          }
        } else {
          const response = {
            Status: "Failure",
            Details: "Código caducado, solicite uno nuevo",
          };
          return res.status(400).send(response);
        }
      });
    } catch (err) {
      const response = { Status: "Failure", Details: err.message };
      return res.status(400).send(response);
    }
  },
};