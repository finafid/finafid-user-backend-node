const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderItem: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Variant",
          required: true,
        },
        itemQuantity: {
          type: Number,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    address: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: false,
    },
    tax: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      required: false,
      enum: ["Razorpay", "COD", "Wallet", "PayU"],
    },
    payment_complete: {
      type: Boolean,
      default: false,
    },
    recipient_name: {
      type: String,
      default: false,
    },
    recipient_mobileNumber: {
      type: Number,
      default: false,
    },
    is_utsab: {
      type: Boolean,
      default: false,
    },
    utsavReward: {
      type: Number,
      required: false,
      default: 0,
    },
    basicReward: {
      type: Number,
      required: false,
      default: 0,
    },
    walletBalanceUsed: {
      type: Number,
      required: false,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Pending",
        "Failed",
        "Confirmed",
        "Shipping",
        "Out For delivery",
        "Delivered",
        "Returned",
        "Canceled",
        "Completed",
      ],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
