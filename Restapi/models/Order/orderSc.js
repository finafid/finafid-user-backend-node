const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
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
        unitPrice: {
          type: Number,
        },
        sellingPrice: {
          type: Number,
        },
        utsavPrice: {
          type: Number,
        },
        discount: {
          type: Number,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
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
    },
    tax: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      enum: ["Razorpay", "COD", "Wallet", "PayU"],
    },
    payment_complete: {
      type: Boolean,
      default: false,
    },
    recipient_name: {
      type: String,
      default: "",
    },
    recipient_mobileNumber: {
      type: Number,
      default: 0,
    },
    is_utsab: {
      type: Boolean,
      default: false,
    },
    utsavReward: {
      type: Number,
      default: 0,
    },
    basicReward: {
      type: Number,
      default: 0,
    },
    walletBalanceUsed: {
      type: Number,
      default: 0,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    invoicePath: {
      type: String,
      default: "",
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    utsavDiscount: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Failed",
        "Confirmed",
        "Shipping",
        "Out For delivery",
        "Delivered",
        "Returned",
        "Canceled",
        "Refund Completed",
        "Pickup Completed",
        "Completed",
      ],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// 🔹 Generate Unique 12-character Order ID Before Saving
orderSchema.pre("validate", async function (next) {
  if (!this.orderId) {
    let unique = false;
    let generatedId;

    while (!unique) {
      generatedId = `F${Math.random().toString(36).substr(2, 11).toUpperCase()}`;
      if (generatedId.length > 12) {
        generatedId = generatedId.slice(0, 12); // Ensure exactly 12 characters
      }
      const existingOrder = await mongoose.model("Order").findOne({ orderId: generatedId });
      if (!existingOrder) unique = true;
    }

    this.orderId = generatedId;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
