const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const variantSchema = new Schema(
  {
    product: {
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
        type: String, // URL(s) of the image(s)
      },
    ],
  },
  { timestamps: true }
);

const Variant = mongoose.model("Variant", variantSchema);
module.exports = Variant;
