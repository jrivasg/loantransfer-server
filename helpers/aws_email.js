const nodemailer = require("nodemailer");

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

  // Specify the fields in the email.
  let mailOptions = {
    from: "Info Loan Transfer <info@loan-transfer.com>",
    to: toAddresses,
    subject: subject,
    //cc: ccAddresses,
    //bcc: bccAddresses,
    //text: body_text,
    html: body_html,
    // Custom headers for configuration set and message tags.
    /* headers: {
      "X-SES-CONFIGURATION-SET": configurationSet,
      "X-SES-MESSAGE-TAGS": tag0,
      "X-SES-MESSAGE-TAGS": tag1,
    }, */
  };

  // Send the email.
  let info = await transporter.sendMail(mailOptions);

  console.log("Message sent! Message ID: ", info.messageId);
};

module.exports = {
  sendEmail,
};