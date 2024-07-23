
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema(
  {
    // user_id: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     required: true,
    //     ref: 'User'
    // },
    email: {
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

const otpModel = mongoose.model('Otp', otpSchema); // Corrected model name
module.exports = otpModel;
