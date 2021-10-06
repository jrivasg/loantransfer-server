const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
    },
    displayName: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    passwordUpdatedAt: {
      type: Date,
    },
    validSince: {
      type: Date,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    openBid: {
      type: Boolean,
      default: false,
    },
    chat: [{ type: Schema.Types.ObjectId, ref: "chat" }],
    sale: [{ type: Schema.Types.ObjectId, ref: "sale" }],
    lastLoginAt: { type: Date },
    lastRefreshAt: {
      type: Date,
    },
    job: { type: String },
    telephone: { type: String },
    company: { type: String },
    cif: { type: String },
    address: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

UserSchema.pre("save", async function (next) {
  try {
    /* 
    Here first checking if the document is new by using a helper of mongoose .isNew, therefore, this.isNew is true if document is new else false, and we only want to hash the password if its a new document, else  it will again hash the password if you save the document again by making some changes in other fields incase your document contains other fields.
    */
    if (this.isNew) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    }
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model("user", UserSchema);
module.exports = User;
