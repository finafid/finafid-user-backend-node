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
          "Out For delivery",
          "Delivered",
          "Returned",
          "Failed to Delivered",
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

