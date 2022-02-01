const createError = require("http-errors");
const Bid = require("../Models/bid.model");
const User = require("../Models/User.model");
var mongoose = require("mongoose");
const client = require("../helpers/init_redis");
const aws_email = require("../helpers/aws_email");
const { createReport } = require("../helpers/Report");
const { getHtmltoSend } = require("../Templates/useTemplate");
var fs = require("fs");
const DIR = "./uploads/";
const path = require("path");

module.exports = {
  getAll: async (req, res, next) => {
    try {
      //console.log(req.payload);
      const bid = await Bid.find().lean();
      bid.sort(compare);
      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },

  getMybids: async (req, res, next) => {
    try {
      const { user_id } = req.body;
      //console.log(req.payload);
      const bid = await Bid.find({ final_buyer: user_id }).lean();
      bid.sort(compare);
      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },

  getActiveBids: async (req, res, next) => {
    let today = new Date();
    let yesterday = new Date();
    let endTime = new Date();
    yesterday.setHours(today.getHours() - 8);
    endTime.setDate(today.getDate() + 14);

    try {
      //console.log(req.payload);
      const bid = await Bid.find({
        starting_time: { $gte: yesterday, $lte: endTime },
        finish: false,
      }).lean();

      bid.sort(compare);
      bid.reverse();
      res.status(200).json({ bid, now: new Date() });
    } catch (error) {
      next(error);
    }
  },

  getOneSubbid: async (req, res, next) => {
    const { bid_id, subbid_id } = req.body;
    try {
      subbid = await getSubbidDetails(bid_id, subbid_id, req.payload.aud);

      //console.log(subbid);
      res.status(200).json(subbid);
    } catch (error) {
      next(error);
    }
  },

  getOneBid: async (req, res, next) => {
    const { bid_id } = req.body;
    try {
      const bid = await Bid.findById(bid_id).lean();

      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },

  getInfo: async (req, res, next) => {
    try {
      const users = await User.find().lean();
      const _id = new mongoose.Types.ObjectId();

      res.status(200).json({
        users,
        _id,
      });
    } catch (error) {
      next(error);
    }
  },

  getReport: async (req, res, next) => {
    const { bid_id, subbid_id } = req.query;

    try {
      let workbook;

      subbid = await getSubbidDetails(bid_id, subbid_id);
      workbook = createReport(subbid);
      const tempath = DIR + subbid_id;
      !fs.existsSync(tempath) && fs.mkdirSync(tempath);

      var filePath = path.join("uploads/" + subbid_id + "/report.xlsx");

      await workbook.xlsx.writeFile("uploads/" + subbid_id + "/report.xlsx");
      var readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  createBid: async (req, res, next) => {
    const {
      _id,
      title,
      minimunAmount,
      totalDebt,
      principalMount,
      icons,
      bids,
      seller,
      starting_time,
      end_time,
    } = req.body;

    const bidExists = await Bid.findById(_id).lean();
    if (bidExists) {
      Bid.findByIdAndUpdate(
        _id,
        {
          title,
          minimunAmount,
          totalDebt,
          principalMount,
          icons,
          bids,
          seller,
          starting_time,
          end_time,
        },
        { new: true },
        (err, bid) => {
          if (err) res.status(500).json(err);
          initilizeRedisBidObject(bid);

          if (!bid.notifications.created) {
            let jsonBid = JSON.parse(JSON.stringify(bid));
            sendNewBidEmail(jsonBid);
          }
          res.status(200).json(bid);
        }
      );
    } else {
      new Bid({
        _id,
        title,
        seller,
        bids,
        starting_time,
        end_time,
      }).save(async (err, bid) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }
        let jsonBid = JSON.parse(JSON.stringify(bid));
        initilizeRedisBidObject(jsonBid);

        sendNewBidEmail(jsonBid);

        res.status(200).json(bid);
      });
    }
  },

  deleteBid: async (req, res, next) => {
    try {
      Bid.findByIdAndDelete(req.body.bid_id, (err, bid) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }
        res.status(200).json("Subasta borrada");
      });
    } catch (error) {
      console.log(error);
    }
  },
};

const initilizeRedisBidObject = (bid) => {
  bid.bids.forEach(({ minimunAmount, _id, seller }) => {
    const puja = [
      {
        from: null,
        time: new Date(),
        bid_id: bid._id,
        amount: minimunAmount,
        subbid_id: _id,
        active: false,
        finish: false,
        endTime: new Date(bid.end_time),
      },
    ];
    client.SET(String(_id), JSON.stringify(puja), (err, reply) => {
      if (err) console.log(err.message);
    });
    /* client.SET(String(bid._id), JSON.stringify({ endTime: new Date(bid.end_time) }), (err, reply) => {
      if (err) console.log(err.message);
    }); */
  });
};

const compare = (a, b) => {
  const firstElement = new Date(a.starting_time).getTime();
  const secondElement = new Date(b.starting_time).getTime();

  if (firstElement > secondElement) {
    return -1;
  }
  if (firstElement < secondElement) {
    return 1;
  }
  return 0;
};

const sendNewBidEmail = async (jsonBid) => {
  // Obtención de datos para envío de nueva y subasta y programar envío de recordatorio
  const company = await User.findById(jsonBid.seller).select("company");
  let users = await User.find({}).select("email -_id").lean();
  users = users.map((user) => user.email);
  const tempTime = new Date(jsonBid.starting_time);
  tempTime.setHours(
    tempTime.getHours() + 1 + Math.abs(new Date().getTimezoneOffset() / 60)
  );

  const email_message = getHtmltoSend("../Templates/bid/newBid_template.hbs", {
    bid: jsonBid,
    id: String(jsonBid._id).slice(-6),
    company: company.company,
    start: tempTime.toLocaleString("es-ES"),
  });
  const email_subject = "Nueva Cartera programada para subasta";
  const emailSentInfo = await aws_email.sendEmail(
    users,
    email_subject,
    email_message,
    "logo_loan_transfer.png"
  );

  if (emailSentInfo.accepted.length > 0) {
    console.log("Email creación de cartera enviado");
    Bid.findByIdAndUpdate(
      jsonBid._id,
      {
        $set: { "notifications.created": true },
      },
      { new: true },
      (err, bid) => {
        if (err) res.status(500).json(err);
      }
    );
    // TODO LOG de a quien se ha enviado
  }

  // TODO arreglar el programar envio email recordatoria subasta
  const dateSchedule = new Date();
  dateSchedule.setDate(dateSchedule.getDate() + 14);
  aws_email.scheduleEmail(email_subject, email_message, dateSchedule);
};

const getSubbidDetails = async (bid_id, subbid_id, user_id) => {
  try {
    const bid = await Bid.findById(bid_id).lean();
    let subbid = bid.bids.find((sub) => String(sub._id) === String(subbid_id));
    const { admin } = await User.findById(user_id).select("admin -_id").lean();

    subbid.documents = bid.documents;
    subbid.starting_time = bid.starting_time;
    subbid.end_time = bid.end_time;
    subbid.viewers = bid.viewers;
    subbid.seller = bid.seller;

    if (admin) {
      let pujas = await Promise.all(
        subbid.data.map(async (puja) => {
          if (puja.from === null) return;
          return User.findById(mongoose.Types.ObjectId(puja.from))
            .select("displayName company -_id")
            .lean();
        })
      );
      pujas = pujas.filter((puja) => puja !== undefined);
      subbid.data = subbid.data.filter((puja) => puja.from !== null);

      subbid.data = subbid.data.map((subbid, index) => {
        subbid = { ...subbid, ...pujas[index] };
        return subbid;
      });

      // Se envía nombre y compañía de cada persona que entró mientras estaba la subasta en marcha
      subbid.viewers = await Promise.all(
        subbid.viewers.map((viewer) => {
          return User.findById(mongoose.Types.ObjectId(viewer))
            .select("displayName company -_id")
            .lean();
        })
      );
    } else {
      delete subbid["data"];
      delete subbid.viewers;
    }

    return subbid;
  } catch (error) {
    console.log(error);
  }
};
