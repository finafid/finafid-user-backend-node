const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderItem: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
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
      // locality: {
      //   type: String,
      // },
      // city: {
      //   type: String,
      // },
      // street: {
      //   type: String,
      // },
      // houseNumber: {
      //   type: String,

      //   validate: {
      //     validator: function (value) {
      //       return /^[a-zA-Z0-9 ]+$/.test(value);
      //     },
      //     message: "House number must be alphanumeric",
      //   },
      // },
      // pinCode: {
      //   type: Number,
      // },
      // landMark: {
      //   type: String,
      // },
      // state: {
      //   type: String,
      // },
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
    tax: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      required: false,
      enum: ["Razorpay", "COD", "Wallet"],
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
    status: {
      type: String,
      required: true,
      enum: [
        "Pending",
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
