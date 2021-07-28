const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BidSchema = new Schema(
  {
    Id: {
      type: Number,
      required: true,
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
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
        subtitle: {
          type: String,
          required: true,
        },
      },
      {
        _id: false,
        title: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
        subtitle: {
          type: String,
          required: true,
        },
      },
      {
        _id: false,
        title: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    icons: [
      {
        _id: false,
        value: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    bid: [
      {
        id: {
          type: Number,
          required: true,
        },
        reference: {
          type: String,
          required: true,
        },
        attachmentCount: {
          type: Number,
          required: true,
        },
        principalMount: {
          type: String,
          required: true,
        },
        progressionPrincipal: {
          type: Number,
          required: true,
        },
        progressionTotal: {
          type: Number,
          required: true,
        },
        time: {
          type: String,
          required: true,
        },
        data: [
          {
            _id: false,
            name: {
              type: String,
              required: true,
            },
            data: [
              {
                type: Number,
                required: true,
              },
            ],
            value: {
              type: Number,
              required: true,
            },
            status: {
              type: Number,
              required: true,
            },
            subtitle: {
              type: String,
              required: true,
            },
            historial: [
              {
                from: {
                  type: Schema.Types.ObjectId,
                  ref: "user",
                },
                amount: {
                  type: Number,
                  required: true,
                },
                time: {
                  type: Number,
                  required: true,
                },
              },
            ],
          },
        ],
      },
    ],
    starting_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    active: { type: Boolean },
    documentation: [
      {
        _id: false,
        url: String,
        text: String,
      },
    ],
    seller: { type: Schema.Types.ObjectId, ref: "User" },
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
