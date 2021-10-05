const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const Bid = require("../Models/bid.model");
const { newBidEmailTemplate } = require("../Templates/new_bid_template");

module.exports = {
  send: async (email, email_subject, email_message) => {
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
      html: email_message,
    };

    const verification = await transporter.verify();
    console.log(verification);

    //Send Email
    await transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        return res.status(400).send({ Status: "Failure", Details: err });
      } else {
        return res.send({ Status: "Success" });
      }
    });
  },

  scheduleEmail: async (email, email_subject, email_message) => {
    const date = new Date(2021, 09, 05, 18, 23, 0);
    const tempBid = await Bid.findById("6155e59ec25a6800513d0f46").lean();
    //console.log("tempBid", tempBid);
    schedule.scheduleJob(date, function () {
      module.exports.send(
        ["jrivasgonzalez@gmail.com"],
        "Nueva Cartera Programada",
        newBidEmailTemplate(tempBid)
      );
      console.log("Mensaje programado enviado");
    });
  },
};
