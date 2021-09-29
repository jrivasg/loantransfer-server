const nodemailer = require("nodemailer");

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
    }
}