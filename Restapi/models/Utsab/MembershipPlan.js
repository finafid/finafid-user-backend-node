const mongoose = require("mongoose");
const memberShipSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    reward: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["On", "Off"],
    },
    instruction:{
       type: String,
    },
    identity: {
      type: String,
      required: false,
      enum: ["PLAN_IDENTITY"],
      default: "PLAN_IDENTITY",
    },
  },
  { timestamps: true }
);
const MemberShipPlan = mongoose.model("MemberShipPlan", memberShipSchema);

module.exports = MemberShipPlan;
