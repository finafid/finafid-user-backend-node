
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FlashDealSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
        require: false,
      },
    ],
    banner: {
      type: String,
      required: true,
    },

    start_Date: {
      type: Date,
      required: true,
    },
    end_Date: {
      type: Date,
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const FlashDeal = mongoose.model("FlashDeal", FlashDealSchema);

module.exports = FlashDeal;
