const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const Job = require("../Models/job.model");
const User = require("../Models/User.model");

const sendEmail = async (
  toAddresses,
  subject,
  body_html,
  img_name,
  bccAddresses
) => {
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
    bcc: bccAddresses,
    //text: body_text,
    html: body_html,
    attachments: [
      {
        filename: img_name,
        path: process.cwd() + "/assets/images/" + img_name,
        cid: "imagename",
      },
    ],
  };

  // Send the email.
  let info = await transporter.sendMail(mailOptions);

  return info;
};

const scheduleEmail = async (subject, body_html, date, img_name) => {
  const dateSchedule = new Date(date);

  schedule.scheduleJob(dateSchedule, async () => {
    let users = await User.find({}).select("email -_id").lean();
    users = users.map((user) => user.email);
    sendEmail(users, subject, body_html, img_name);
  });

  new Job({
    email: {
      date: dateSchedule,
      html: String(body_html),
      subject,
      imageName: img_name,
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
