const mongoose = require("mongoose");

const rewardTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  points: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  transaction_message: { type: String },
});

module.exports = mongoose.model("RewardTransaction", rewardTransactionSchema);
