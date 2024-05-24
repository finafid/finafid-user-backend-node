const mongoose = require('mongoose');
const User=require('../../models/auth/userSchema')

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
      type: String, // Corrected type definition (String should be capitalized)
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    street: {
      type: String,
      required: false,
    },
    houseNumber: {
      type: String,
      required: false,
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9]+$/.test(value);
        },
        message: "House number must be alphanumeric",
      },
    },
    state: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum:["Pending","Active"],
      default:"Pending"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
