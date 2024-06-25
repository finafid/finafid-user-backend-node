const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const variantSchema = new Schema(
  {
    productGroup: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    attributes: {
      type: Schema.Types.Mixed, // Use Mixed type for flexibility
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    taxModel: {
      type: String,
      enum: ["include", "exclude"],
      required: true,
    },
    isUtsav: {
      type: Boolean,
      default: false,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
    cod: {
      type: Boolean,
      default: false,
    },
    images: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

const Variant = mongoose.model("Variant", variantSchema);
module.exports = Variant;
