const mongoose = require("mongoose");
const referralSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "user",
    },
    code: {
      type: String,
      required: true,
    },
    referred_user: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: false,
      },
    ],
  },
  { timestamps: true }
);

const Referral = mongoose.model("Referral", referralSchema); // Corrected model name
module.exports = Referral;
