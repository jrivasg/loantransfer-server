const createError = require("http-errors");
const Bid = require("../Models/bid.model");
const User = require("../Models/User.model");
var mongoose = require("mongoose");

module.exports = {
  getAll: async (req, res, next) => {
    try {
      //console.log(req.payload);
      const bid = await Bid.find().lean();
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
      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },

  getActiveBids: async (req, res, next) => {
    let today = new Date();
    let yesterday = new Date();
    let endTime = new Date();
    yesterday.setDate(today.getDate() - 1);
    endTime.setDate(today.getDate() + 15);

    console.log(yesterday, endTime);
    try {
      //console.log(req.payload);
      const bid = await Bid.find({
        starting_time: { $gte: yesterday, $lte: endTime },
      }).lean();
      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },

  getOne: async (req, res, next) => {
    const { bid_id, subbid_id } = req.body;
    try {
      const bid = await Bid.findById(bid_id).lean();
      const subbid = bid.bids.find(
        (sub) => String(sub._id) === String(subbid_id)
      );

      //console.log(subbid);

      res.status(200).json(subbid);
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
        _id
      });
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
      documents,
      starting_time,
      end_time,
    } = req.body;
    console.log("documents", req.body.documents);

    /* req.documents.files.forEach((file) => {
      Bid.findByIdAndUpdate(
        bid_id,
        { $push: { documents: file } },
        { new: true },
        (err, bid) => {
          if (err) res.status(500).json(err);
          const doc = bid.documents[bid.documents.length - 1];
          res.status(200).json({
            message: "Archivo/s guardado/s",
            doc_id: doc._id,
            mymetype: doc.mimetype,
            name: doc.originalname,
          });
        }
      );
    }); */

    new Bid({
      _id,
      title,
      seller,
      bids,
      documents: documents.file,
      starting_time,
      end_time,
    }).save((err, bid) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }
      console.log("Subasta creada", bid);
      res.status(200).json(bid);
    });
  },
};

/*  let start = new Date(starting_time);
    let time_start = new Date();
    time_start = start.setHours(start.getHours() + 2);

    let end = new Date(end_time);
    let end_timer = new Date();
    end_timer = end.setHours(start.getHours() + 2); */