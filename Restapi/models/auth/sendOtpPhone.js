const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpToPhoneSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    otp: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      get: (timestamp) => timestamp.getTime(),
      set: (timestamp) => new Date(timestamp),
    },
  },
  { timestamps: true }
);

const OtpPhone = mongoose.model("OtpPhone", otpToPhoneSchema); // Corrected model name
module.exports = OtpPhone;
