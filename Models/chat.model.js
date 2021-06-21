const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    unread: {
      type: Number,
    },
    time: {
      type: Date,
      default: false,
    },
    msg: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const Chat = mongoose.model("chat", ChatSchema);
module.exports = Chat;