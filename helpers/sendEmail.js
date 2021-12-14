const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const Bid = require("../Models/bid.model");
const { getHtmltoSend } = require("../Templates/useTemplate");

module.exports = {
  send: async (email, email_subject, email_message) => {
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: "587",
      secureConnection: false,
      auth: {
        user: `${process.env.EMAIL_ADDRESS}`,
        pass: `${process.env.EMAIL_PASSWORD}`,
      },
      tls: { ciphers: "SSLv3" },
      logger: true,
      //debug:true
    });

    const mailOptions = {
      from: `NPLBroker<${process.env.EMAIL_ADDRESS}>`,
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

  scheduleEmail: async (bid, company) => {
    const tempdate = new Date();
    const dateSchedule = new Date(
      tempdate.getFullYear(),
      tempdate.getMonth(),
      tempdate.getDate(),
      tempdate.getHours(),
      tempdate.getMinutes(),
      tempdate.getSeconds() + 1
    );
    const tempTime = new Date(tempBid.starting_time);
    tempTime.setHours(tempTime.getHours() + 2);
    console.log("tempTime", tempTime.toISOString());

    schedule.scheduleJob(dateSchedule, function () {
      module.exports.send(
        ["jrivasgonzalez@gmail.com"],
        "Nueva Cartera Programada",
        getHtmltoSend("/bid/newBid_template.hbs", {
          bid: tempBid,
          id: tempBid._id.slice(-6),
          company: "NPLBrokers",
          bids: tempBid.bids,
          start: tempTime.toLocaleString(),
        })
      );

      console.log("Mensaje programado enviado");
    });
  },

  pruebasSchedule: async () => {
    const tempdate = new Date();
    const dateSchedule = new Date(
      tempdate.getFullYear(),
      tempdate.getMonth(),
      tempdate.getDate(),
      tempdate.getHours(),
      tempdate.getMinutes(),
      tempdate.getSeconds() + 1
    );

    dateSchedule.setSeconds(dateSchedule.getSeconds() + 2);

    const job = schedule.scheduleJob(dateSchedule, function () {
      console.log("Mensaje programado enviado");
    });
    job.id = 'iddeljob'
const job1 = schedule.scheduleJob(dateSchedule, function () {
  console.log("Mensaje programado enviado");
});
    job1.id = "iddeljob2";
    //console.log(job);
    console.log('Lista trabajos', Object.values(schedule.scheduledJobs)[0].key);
  },
};

const tempBid = {
  _id: "615f226ead62c702523ba9da",
  active: false,
  finish: true,
  viewers: [
    { $oid: "615ddb2afbff9c013d7ced31" },
    { $oid: "615ddc5bf2082c014c47d3e2" },
  ],
  title: "test",
  seller: { $oid: "615ddc5bf2082c014c47d3e2" },
  bids: [
    {
      _id: { $oid: "615f229ead62c702523ba9dc" },
      reference: "Lote 1",
      minimunAmount: 6,
      increment: 6,
      totalDebt: 6,
      totalDebtAvg: 6,
      totalDebtMed: 6,
      mainDebt: 40000,
      mainDebtAvg: 6,
      mainDebtMed: 6,
      accountsNumber: 6,
      dv: 6,
      icons: [{ icon: "BankOutlined", title: "No judicializada" }],
      data: [
        {
          from: null,
          time: { $date: "2021-10-07T16:38:54.068Z" },
          amount: 6,
        },
        {
          from: { $oid: "615ddb2afbff9c013d7ced31" },
          time: { $date: "2021-10-07T16:41:52.885Z" },
          amount: 12,
        },
        {
          from: { $oid: "615ddc5bf2082c014c47d3e2" },
          time: { $date: "2021-10-07T16:43:15.136Z" },
          amount: 18,
        },
        {
          from: { $oid: "615ddb2afbff9c013d7ced31" },
          time: { $date: "2021-10-07T16:43:30.602Z" },
          amount: 24,
        },
      ],
      buyer: { $oid: "615ddb2afbff9c013d7ced31" },
      finalAmount: 15000,
    },
    {
      _id: { $oid: "615f229ead62c702523ba9dc" },
      reference: "Lote 2",
      minimunAmount: 6,
      increment: 6,
      totalDebt: 6,
      totalDebtAvg: 6,
      totalDebtMed: 6,
      mainDebt: 50000,
      mainDebtAvg: 6,
      mainDebtMed: 6,
      accountsNumber: 6,
      dv: 6,
      icons: [{ icon: "BankOutlined", title: "No judicializada" }],
      data: [
        {
          from: null,
          time: { $date: "2021-10-07T16:38:54.068Z" },
          amount: 6,
        },
        {
          from: { $oid: "615ddb2afbff9c013d7ced31" },
          time: { $date: "2021-10-07T16:41:52.885Z" },
          amount: 12,
        },
        {
          from: { $oid: "615ddc5bf2082c014c47d3e2" },
          time: { $date: "2021-10-07T16:43:15.136Z" },
          amount: 18,
        },
        {
          from: { $oid: "615ddb2afbff9c013d7ced31" },
          time: { $date: "2021-10-07T16:43:30.602Z" },
          amount: 24,
        },
      ],
      buyer: { $oid: "615ddb2afbff9c013d7ced31" },
      finalAmount: 25000,
    },
  ],
  starting_time: "2021-10-07T16:40:00.113Z",
  end_time: { $date: "2021-10-07T16:46:00.927Z" },
  documents: [],
  createdAt: { $date: "2021-10-07T16:38:54.010Z" },
  updatedAt: { $date: "2021-10-07T16:46:01.083Z" },
};
