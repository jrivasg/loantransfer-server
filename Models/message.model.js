const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      enum: ["me", "opposite"],
    },
    time: {
      type: Date,
    },
    msgType: {
      type: String,
      enum: ["text", "file"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const Message = mongoose.model("message", MessageSchema);
module.exports = Message;
