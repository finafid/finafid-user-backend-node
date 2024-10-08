const mongoose = require("mongoose");
const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
    },
    transaction_message: {
      type: String,
      required: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);
const walletTransaction = mongoose.model(
  "walletTransaction",
  walletTransactionSchema
);

module.exports = walletTransaction;
