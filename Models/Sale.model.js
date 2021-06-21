const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SaleSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
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
    final_buyer: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const Sale = mongoose.model("message", SaleSchema);
module.exports = Sale;
