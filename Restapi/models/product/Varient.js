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
    variantDetails: {
      type: Schema.Types.Mixed, // Use Mixed type for flexibility
      required: false,
    },
    name: {
      type: String,
      required: false,
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
    taxPercent: {
      type: Number,
      required: true,
    },
    isUtsav: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: Number,
      required: true,
    },
    discountType: {
      type: String,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
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
    utsavDiscount: {
      type: Number,
      required: true,
    },
    // hasShippingCost: {
    //   type: Boolean,
    //   required: true,
    // },
    shippingCost: {
      type: Number,
      required: true,
    },
    utsavPrice: {
      type: Number,
      required: false,
    },
    minOrderQuantity: {
      type: Number,
      required: true,
    },
    barCode: {
      type: String,
      required: true,
    },
    is_featured: {
      type: Boolean,
      required: false,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
      required: false,
    },
    utsavReward: {
      type: Number,
      required: false,
    },
    basicReward: {
      type: Number,
      required: false,
    },
    utsavDiscountType: {
      type: String,
      required: false,
    },
    newArrival: {
      type: Boolean,
      default: false,
      required: false,
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
