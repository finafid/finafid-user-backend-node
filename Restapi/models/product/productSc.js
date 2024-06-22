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
      ref: "MainCategory",
      require: true,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      require: true,
    },
    productType: {
      type: Schema.Types.ObjectId,
      ref: "ProductType",
      require: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    is_shipping_cost_need: {
      type: Boolean,
      default: false,
    },
    is_cash_on_delivery_avail: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: true,
    },
    imgUrl: [
      {
        type: String,
        required: true,
      },
    ],
    details: {
      type: Schema.Types.Mixed,
    },
    isCustomizable: {
      type: Boolean,
      default: false,
    },
    has_expiry: {
      type: Boolean,
      default: false,
    },
    is_expiry_expiry_salable: {
      type: Boolean,
      default: false,
    },
    unit: {
      type: String,
      default: false,
      enum: ["kg", "li", "piece"],
    },
    is_utsab_product: {
      type: Boolean,
      default: false,
    },
    utsab_discount: {
      type: Number,
      required: true,
    },
    variant: [
      {
        type: Schema.Types.ObjectId,
        ref: "Variant",
        require: true,
      },
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
