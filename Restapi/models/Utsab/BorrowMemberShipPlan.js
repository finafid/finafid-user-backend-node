const mongoose = require("mongoose");
const borrowMemberShipSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    due: {
      type: Number,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
    identity: {
      type: String,
      required: false,
      enum: ["BORROW_IDENTITY"],
      default: "BORROW_IDENTITY",
    },
  },
  { timestamps: true }
);
const BorrowMemberShipPlan = mongoose.model(
  "BorrowMemberShipPlan",
  borrowMemberShipSchema
);

module.exports = BorrowMemberShipPlan;
