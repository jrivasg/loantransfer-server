const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OTPschema = new Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    expiration_time: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const OTP = mongoose.model("otp", OTPschema);
module.exports = OTP;
