const createError = require("http-errors");
const Bid = require("../Models/bid.model");

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
    endTime.setDate(today.getDate() + 14);

    console.log(yesterday, endTime)
    try {
      //console.log(req.payload);
      const bid = await Bid.find({ starting_time: { $gte: yesterday, $lte: endTime } }).lean();
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

  createBid: async (req, res, next) => {
    const { title, minimunAmount, totalDebt, principalMount, icons, bids, seller, documentation, starting_time, end_time } = req.body;
    console.log('create bid', req.body);
    let start = new Date(starting_time);
    let time_start = new Date();
    time_start = start.setHours(start.getHours() + 2);

    new Bid({
      title,
      info: [
        {
          title: "Precio inicial",
          value: minimunAmount,
        },
        {
          title: "Deuda total",
          value: totalDebt,
        },
        {
          title: "Deuda principal",
          value: principalMount,
        },
      ],
      seller,
      icons,
      bids,
      documentation,
      starting_time: time_start,
      end_time
    }).save((err, bid) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }
      console.log("Subasta creada", bid)
      res.status(200).json(bid);
    });
  },
};
