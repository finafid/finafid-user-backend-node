const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  points: { type: Number, default: 0 },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "RewardTransaction" }],
});

const Reward = mongoose.model("Reward", rewardSchema);
module.exports = Reward; 