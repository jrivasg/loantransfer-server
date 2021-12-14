const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jobSchema = new Schema(
  {
    email: {
      date: { type: Date },
      html: { type: String },
      subject: { type: String },
    },
    task: {
      cron: { type: String },
      path: { type: String },
    },
    completed: { type: Boolean, default: false },
    type: { type: String, enum: ["emailToAll", "backupTask", "deleteTask"] },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const JOB = mongoose.model("job", jobSchema);
module.exports = JOB;
