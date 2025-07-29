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
    },
    email_validation: {
      type: Boolean,
      default: false,
    },
    push_notification: {
      type: Boolean,
      default: true,
    },
    fcmToken: { 
      type: String,
    },
    fcmTokens: {
      type: [String], 
      default: [],
    },
    is_utsav: {
      type: Boolean,
      default: false,
    },
    firstOrderComplete: {
      type: Boolean,
      default: false,
    },
    is_Active: {
      type: Boolean,
      default: true,
    },
    blocking: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
    },
  },
  { timestamps: true }
);

// ✅ Register as "User" (capital U, matches populate("userId"))
const User = mongoose.model("User", UserSchema);
module.exports = User;
