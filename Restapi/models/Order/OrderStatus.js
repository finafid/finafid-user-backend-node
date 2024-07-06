const { date } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderStatusSchema = new Schema({
  orderStatusDetails: [
    {
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
      },
      date: {
        type: Date,
        required: true,
      },
    },
  ],
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
});

const OrderStatus = mongoose.model("OrderStatus", orderStatusSchema);

module.exports = OrderStatus;

