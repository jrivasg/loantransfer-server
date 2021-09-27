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
          type: Schema.Types.ObjectId,
          ref: "user",
        },
        time: {
          type: Number,
        },
        msgType: {
          type: String,
          enum: ["text", "file"],
        },
        doc_id: {
          type: Schema.Types.ObjectId,
        },
        unread: { type: Boolean, default: true },
      },
    ],
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
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const Chat = mongoose.model("chat", ChatSchema);
module.exports = Chat;
