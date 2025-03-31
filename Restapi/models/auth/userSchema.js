const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const UserSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: false,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
    },
    imgUrl: {
      type: String,
    },
    phone: {
      type: Number,
      required: true,
      //unique: true,
    },
    email_validation: {
      type: Boolean,
      required: false,
      default: false,
    },
    push_notification: {
      type: Boolean,
      default: true,
      required: false,
    },
    fcmToken: { 
      type: String,
      required: false,
     },
     fcmTokens: {
      type: [String], 
      default: [],
      required: false,
    },
    is_utsav: {
      type: Boolean,
      required: false,
      default: false,
    },
    firstOrderComplete: {
      type: Boolean,
      required: false,
      default: false,
    },
    is_Active: {
      type: Boolean,
      required: false,
      default: true,
    },
    blocking: {
      type: Boolean,
      required: false,
      default: false,
    },
    googleId: {
      type: String,

    },
  },
  { timestamps: true }
);
const userModel = mongoose.model("user", UserSchema);
module.exports = userModel;
