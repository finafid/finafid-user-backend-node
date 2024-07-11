const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const getAndBuySchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      require: false,
    },
  ],
  banner: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
});
const GetAndBuy = mongoose.model("GetAndBuy", getAndBuySchema);

module.exports = GetAndBuy;
