const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BidSchema = new Schema(
  {
    Id: {
      type: Number,
    },
    title: {
      type: String,

    },
    info: [
      {
        _id: false,
        title: {
          type: String,
        },
        value: {
          type: String,
        },
      },
      {
        _id: false,
        title: {
          type: String,
        },
        value: {
          type: String,
        },
      },
      {
        _id: false,
        title: {
          type: String,
        },
        value: {
          type: String,
        },
      },
    ],
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
    seller: { type: Schema.Types.ObjectId, ref: "User" },
    bids: [
      {
        reference: {
          type: String,

        },
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
        attachmentCount: {
          type: Number,

        },
        totalDebt: {
          type: Number,

        },
        totalDebtAvg: {
          type: Number,

        },
        totalDebtMed: {
          type: Number,

        },
        mainDebtAvg: {
          type: Number,

        },
        mainDebtMed: {
          type: Number,

        },
        accountsNumber: {
          type: Number,

        },
        minimunAmount: {
          type: Number,

        },
        dv: {
          type: Number,

        },
        mainDebt: {
          type: String,

        },
        progressionPrincipal: {
          type: Number,
        },
        progressionTotal: {
          type: Number,
        },
        starting_time: { type: Date },
        end_time: { type: Date },
        data: [
          {
            _id: false,
            from: {
              type: Schema.Types.ObjectId,
              ref: "user",
            },
            amount: {
              type: Number,
            },
            time: {
              type: Number,
            },
          },
        ],
        documentation: [],
      },
    ],
    starting_time: { type: Date },
    end_time: { type: Date },
    active: { type: Boolean, default: false },
    documentation: [],
    documents: [
      {
        fieldname: {
          type: String,
        },
        originalname: {
          type: String,
        },
        encoding: {
          type: String,
        },
        mimetype: {
          type: String,
        },
        destination: {
          type: String,
        },
        filename: {
          type: String,
        },
        path: {
          type: String,
        },
        size: {
          type: String,
        },
      },
    ],
    final_buyer: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const Bid = mongoose.model("bid", BidSchema);
module.exports = Bid;
