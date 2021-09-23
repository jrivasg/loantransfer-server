const createError = require("http-errors");
const Bid = require("../Models/bid.model");
const User = require("../Models/User.model");
var mongoose = require("mongoose");
const client = require("../helpers/init_redis");

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
    yesterday.setHours(today.getHours() - 8);
    endTime.setDate(today.getDate() + 14);

    try {
      //console.log(req.payload);
      const bid = await Bid.find({
        starting_time: { $gte: yesterday, $lte: endTime },
      }).lean();

      bid.sort(compare);
      res.status(200).json({ bid, now: new Date() });
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

      subbid.documents = bid.documents;
      subbid.starting_time = bid.starting_time;
      subbid.end_time = bid.end_time;
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
      }).save((err, bid) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }
        initilizeRedisBidObject(bid);
        res.status(200).json(bid);
      });
    }
  },
};

const initilizeRedisBidObject = (bid) => {
  bid.bids.forEach(({ minimunAmount, _id }) => {
    const puja = [{
      from: null,
      time: new Date(),
      bid_id: bid._id,
      amount: minimunAmount,
      subbid_id: _id,
      active: false,
      finish: false,
      endTime: new Date(bid.end_time)
    }];
    client.SET(String(_id), JSON.stringify(puja), (err, reply) => {
      if (err) console.log(err.message);
    });
    /* client.SET(String(bid._id), JSON.stringify({ endTime: new Date(bid.end_time) }), (err, reply) => {
      if (err) console.log(err.message);
    }); */
  })
}

const compare = (a, b) => {
  const firstElement = new Date(a.end_time).getTime();
  const secondElement = new Date(b.end_time).getTime();

  if (firstElement < secondElement) {
    return -1;
  }
  if (firstElement > secondElement) {
    return 1;
  }
  return 0;
}