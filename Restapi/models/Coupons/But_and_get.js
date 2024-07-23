const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const getAndBuySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: false,
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
    buyQuantity: {
      type: Number,
      required: true,
    },
    getQuantity: {
      type: Number,
      required: true,
    },
    dealType: {
      type: String,
      enum: ["BUY_ONE_GET_ONE", "BUY_TWO_GET_ONE", "CUSTOM"],
      required: true,
    },
    customConditions: {
      buyProducts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },
      ],
      getProducts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },
      ],
    },
  },
  { timestamps: true }
);

const GetAndBuy = mongoose.model("GetAndBuy", getAndBuySchema);

module.exports = GetAndBuy;
