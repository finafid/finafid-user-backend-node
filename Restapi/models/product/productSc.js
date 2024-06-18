const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const productType = require("../product/productType");

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
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
    quantity: {
      type: Number,
      required: true,
    },
    item_code: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    shipping_cost: {
      type: Number,
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
    unit_price: {
      type: Number,
      default: false,
    },
    purchase_price: {
      type: Number,
      default: false,
    },
    Variation_Type: {
      type: String,
      required: true,
      enum: ["Color", "Size", "weight"],
    },
    variation: {
      type: Schema.Types.Mixed,
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
    attributes: {
      color: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      strength: {
        type: Number,
        required: true,
      },
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
    inventory: {
      sku: {
        type: Number,
        required: true,
      },
      item_code: {
        type: String,

        validate: {
          validator: function (value) {
            return /^[a-zA-Z0-9@#$]+$/.test(value);
          },
          message: "House number must be alphanumeric",
        },
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
