const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BidSchema = new Schema(
  {
    Id: { type: Number },
    title: { type: String },
    seller: { type: Schema.Types.ObjectId, ref: "User" },
    bids: [
      {
        reference: { type: String },
        icons: [
          {
            _id: false,
            icon: {
              type: String,
              enum: [
                "BankOutlined",
                "TeamOutlined",
                "LineChartOutlined",
                "CalendarOutlined",
                "UserOutlined",
              ],
            },
            title: {
              type: String,
              enum: [
                "No judicializada",
                "Mercado primario",
                "Ticket medio 392€",
                "DPD medio 260 días",
                "100% cliente particular",
              ],
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
      winner: { type: Boolean, default: false }
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
