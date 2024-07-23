const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    razorpay_orderId: {
      type: String,
      required: true,
    },
    razorpay_payment_id: 
    { type: String, required: false }, 
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
