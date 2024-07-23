const mongoose = require("mongoose");
const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Credit", "Debit"],
    },
    amount: {
      type: Number,
      required: true,
    },
    Date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);
const Wallet = mongoose.model("walletTransaction", walletTransactionSchema);

module.exports = Wallet;
