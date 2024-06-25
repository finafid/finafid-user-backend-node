const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    productTypeId: {
      type: Schema.Types.ObjectId,
      ref: "ProductType",
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    isCustomizable: {
      type: Boolean,
      default: false,
    },
    hasExpiry: {
      type: Boolean,
      default: false,
    },
    unit: {
      type: String,
      required: true,
    },
    barCode: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    variationAttributes: [
      {
        type: String,
        required: true,
      },
    ],
    thumbnail: {
      type: [String], // URL(s) of the image(s)
      required: true,
    },
    otherImages: [
      {
        type: String, // URL(s) of the image(s)
      },
    ],
    totalQuantity: {
      type: Number,
      required: true,
    },
    variants: [
      {
        type: Schema.Types.ObjectId,
        ref: "Variant",
      },
    ],
    is_featured: {
      type: Boolean,
      default: false,
      required: false,
    },
    is_active: {
      type: Boolean,
      default: true,
      required: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
