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
      type: mongoose.Schema.Types.ObjectId, // Corrected type definition
      ref: "User",
      required: false,
    },
    locality: {
      type: String,
    },
    city: {
      type: String,
    },
    street: {
      type: String,
    },
    houseNumber: {
      type: String,

      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9 ]+$/.test(value);
        },
        message: "House number must be alphanumeric",
      },
    },
    pinCode: {
      type: Number,
    },
    landMark: {
      type: String,
    },
    state: {
      type: String,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Active", "Complete"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
