const mongoose = require("mongoose");
const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    addressType: {
      type: String,
      enum: ["home", "office", "others"],
    },
    receiverName: {
      type: String,
    },
    receiverPhone: {
      type: String,
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
          return /^[a-zA-Z0-9]+$/.test(value);
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
