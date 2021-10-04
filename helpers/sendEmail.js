const nodemailer = require("nodemailer");
const schedule = require("node-schedule");

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
      text: email_message,
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
    const date = new Date(2021, 09, 04, 17, 13, 0);
      schedule.scheduleJob(date, function () {
      module.exports.send(
        ["jrivasgonzalez@gmail.com", "josea.rivas@juntadeandalucia.es"],
        "email programado",
        "Funciona la programación de emails"
      );
      console.log("Mensaje programado enviado");
    });
  },
};
