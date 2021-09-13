const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BidSchema = new Schema(
  {
    Id: {
      type: Number,
    },
    title: {
      type: String,
      required: true,
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
          required: true,
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
          required: true,
        },
        totalDebt: {
          type: Number,
          required: true,
        },
        totalDebtAvg: {
          type: Number,
          required: true,
        },
        totalDebtMed: {
          type: Number,
          required: true,
        },
        mainDebtAvg: {
          type: Number,
          required: true,
        },
        mainDebtMed: {
          type: Number,
          required: true,
        },
        accountsNumber: {
          type: Number,
          required: true,
        },
        minimunAmount: {
          type: Number,
          required: true,
        },
        dv: {
          type: Number,
          required: true,
        },
        mainDebt: {
          type: String,
          required: true,
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
            name: {
              type: String,
            },
            data: [
              {
                type: Number,
              },
            ],
            value: {
              type: Number,
            },
            status: {
              type: Number,
            },
            subtitle: {
              type: String,
            },
            historial: [
              {
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
          },
        ],
        documents: [],
      },
    ],
    starting_time: { type: Date },
    end_time: { type: Date },
    active: { type: Boolean, default: false },
    documentation: [],
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
