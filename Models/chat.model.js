const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
    users: [
      {
        _id: false,
        user_id: {
          type: Schema.Types.ObjectId,
          ref: "user",
        },
        displayName: { type: String },
      },
    ],
    messages: [
      {
        text: {
          type: String,
          required: true,
        },
        from: {
          type: { type: Schema.Types.ObjectId, ref: "user" },
        },
        time: {
          type: Date,
        },
        msgType: {
          type: String,
          enum: ["text", "file"],
        },
        unread: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const Chat = mongoose.model("chat", ChatSchema);
module.exports = Chat;
