const { required, boolean } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dealOfTheDaySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      require: true,
    },

    banner: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const DealOfTheDay = mongoose.model("DealOfTheDay", dealOfTheDaySchema);

module.exports = DealOfTheDay;
