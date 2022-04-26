const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BidSchema = new Schema(
  {
    Id: { type: Number },
    title: { type: String },
    seller: { type: Schema.Types.ObjectId, ref: "User" },
    created:  { type: Boolean, default: false },
    globalIcons: [
      {
        _id: false,
        icon: {
          type: String,
        },
        title: {
          type: String,
        },
      },
    ],
    bids: [
      {
        reference: { type: String },
        active: { type: Boolean, default: false },
        finish: { type: Boolean, default: false },
        icons: [
          {
            _id: false,
            icon: {
              type: String,
            },
            title: {
              type: String,
            },
          },
        ],
        totalDebt: { type: Number },
        totalDebtAvg: { type: Number },
        totalDebtMed: { type: Number },
        mainDebtAvg: { type: Number },
        mainDebtMed: { type: Number },
        accountsNumber: { type: Number },
        minimunAmount: { type: Number },
        dv: { type: Number },
        dpd: { type: Number },
        info: { type: String },
        mainDebt: { type: String },
        data: [
          {
            _id: false,
            from: {
              type: Schema.Types.ObjectId,
              ref: "user",
            },
            amount: { type: Number },
            time: { type: Date },
          },
        ],
        increment: { type: Number },
        buyer: { type: Schema.Types.ObjectId, ref: "User" },
        finalAmount: { type: Number },
        documents: [
          {
            fieldname: { type: String },
            originalname: { type: String },
            encoding: { type: String },
            mimetype: { type: String },
            destination: { type: String },
            filename: { type: String },
            path: { type: String },
            size: { type: String },
          },
        ],
      },
    ],
    starting_time: { type: Date },
    end_time: { type: Date },
    active: { type: Boolean, default: false },
    documents: [
      {
        fieldname: { type: String },
        originalname: { type: String },
        encoding: { type: String },
        mimetype: { type: String },
        destination: { type: String },
        filename: { type: String },
        path: { type: String },
        size: { type: String },
      },
    ],
    finish: { type: Boolean, default: false },
    viewers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notifications: {
      created: { type: Boolean, default: false },
      start: { type: Boolean, default: false },
      winner: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const Bid = mongoose.model("bid", BidSchema);
module.exports = Bid;
