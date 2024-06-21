const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const variantSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variationType: {
      type: String,
      required: true,
    },
    variation: {
      type: String,
      required: true,
    },
    variantImgLink: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
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
    shipping_cost: {
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

const Variant = mongoose.model("Variant", variantSchema);

module.exports = Variant;
