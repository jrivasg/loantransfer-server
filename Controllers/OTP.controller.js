const OTP = require("../Models/OTP.model");
const { encode, decode } = require("../helpers/crypt");
var otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const client = require("../helpers/init_redis");

module.exports = {
  sendEmail: async (req, res, next) => {
    try {
      const { email, type, userId } = req.body;
      let email_subject, email_message;
      if (!email) return res.status(400).send({ error: "Email no recibido" });

      if (!type) return res.status(400).send({ error: "tipo no recibido" });

      //Generate OTP
      const otp = otpGenerator.generate(6, {
        alphabets: false,
        upperCase: false,
        specialChars: false,
      });
      const now = new Date();
      const expiration_time = Date.now() + (1000 * 60 * 10);

      //Create OTP instance in DB
      const otpEl = {
        otp: otp,
        expiration_time: expiration_time,
      };
      client.SET(userId ? userId : 'userID', JSON.stringify(otpEl), "EX", 10 * 60, (err, reply) => {
        if (err) {
          console.log(err.message);
          //createError.InternalServerError();
          return;
        }
        console.log("OTP guardado en DB");
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
          } = require("../Templates/email/email_verification");
          email_message = message(otp);
          email_subject = subject_mail;
        } else if (type == "FORGET") {
          const {
            message,
            subject_mail,
          } = require("../Templates/email/email_forget");
          email_message = message(otp);
          email_subject = subject_mail;
        } else if (type == "2FA") {
          const {
            message,
            subject_mail,
          } = require("../Templates/email/email_2FA");
          email_message = message(otp);
          email_subject = subject_mail;
        } else {
          return res.status(400).send({ error: "Tipo incorrecto recibido" });
        }
      }

      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: `${process.env.EMAIL_ADDRESS}`,
          pass: `${process.env.EMAIL_PASSWORD}`,
        },
      });

      const mailOptions = {
        from: `"J.Rivas"<${process.env.EMAIL_ADDRESS}>`,
        to: `${email}`,
        subject: email_subject,
        text: email_message,
      };

      const verification = await transporter.verify();
      console.log(verification);

      //Send Email
      await transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
          return res.status(400).send({ Status: "Failure", Details: err });
        } else {
          return res.send({ Status: "Success", Details: encoded });
        }
      });
    } catch (err) {
      return res.status(400).send({ error: err.message });
    }
  },
  verify: async (req, res, next) => {
    try {
      var currentdate = new Date();
      const { verification_key, otp, check, userId } = req.body;
      //console.log(req.body);

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
      if (!check) {
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
      if (check_obj != check) {
        const response = {
          Status: "Failure",
          Details: "OTP was not sent to this particular email or phone number",
        };
        return res.status(400).send(response);
      }

      // TODO llamar a REDIS
      client.GET(userId, (err, result) => {
        if (err) {
          console.log(err.message);
          //reject(createError.InternalServerError());
          return;
        }
        const otp_instance = JSON.parse(result);
        console.log(otp_instance);
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
                  Check: check,
                };
                return res.status(200).send(response);
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