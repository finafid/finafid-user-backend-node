const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const brandSchema = new Schema({
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
  utsavFeatured: {
    type: Boolean,
    required: false,
    default: false,
  },
  is_featured: {
    type: Boolean,
    required: false,
    default: false,
  },
  topSellingBrand: {
    type: Boolean,
    default: false,
    required: false,
  },
  categoryList: [
    {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "mainCategory",
    },
  ],
  productTypeList: [
    {
      type: Schema.Types.ObjectId,
      require: false,
      ref: "ProductType",
    },
  ],
});

const Brand = mongoose.model("Brand", brandSchema);

module.exports = Brand;
