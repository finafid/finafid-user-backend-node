const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderStatusSchema = new Schema({
  name: {
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
  description: {
    type: String,
    required: true,
  },
});

const orderStatus = mongoose.model("orderStatus", orderStatusSchema);

module.exports = Brand;
