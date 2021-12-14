const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const Job = require("../Models/job");

const sendEmail = async (toAddresses, subject, body_html) => {
  // Create the SMTP transport.
  let transporter = nodemailer.createTransport({
    host: "email-smtp.eu-west-1.amazonaws.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  let mailOptions = {
    from: "Info Loan Transfer <info@loan-transfer.com>",
    to: toAddresses,
    subject: subject,
    //cc: ccAddresses,
    //bcc: bccAddresses,
    //text: body_text,
    html: body_html,
  };

  // Send the email.
  let info = await transporter.sendMail(mailOptions);

  console.log("Message sent! Message ID: ", info.messageId);
};

const scheduleEmail = async (toAddresses, subject, body_html, date) => {
  const dateSchedule = new Date(date);

  schedule.scheduleJob(dateSchedule, function () {
    sendEmail(toAddresses, subject, body_html);
  });

  new Job({
    email: {
      date: dateSchedule,
      html: body_html,
      subject,
    },
    type: "emailToAll",
  }).save(async (err, job) => {
    if (err) {
      console.log(err);
    }
  });
};

module.exports = {
  sendEmail,
  scheduleEmail,
};
