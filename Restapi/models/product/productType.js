const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const productTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    logoUrl: {
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
      ref: "subCategory",
      require: true,
    },
    is_featured: {
      type: Boolean,
      required: false,
      default: false,
    },
    variationFeatures: [
      {
        type: String,
        required: false,
      },
    ],
  },
  { timestamps: true }
);

const ProductType = mongoose.model("ProductType", productTypeSchema);

module.exports = ProductType;
