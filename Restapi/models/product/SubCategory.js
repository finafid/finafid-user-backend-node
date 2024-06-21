const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mainCategory = require("../product/mainCatagory");

const subCategorySc = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      
    },
    logoUrl: {
      type: String,
      required: true,
    },
    mainCategoryId: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "mainCategory",
    },
  },
  { timestamps: true }
);

const SubCategory = mongoose.model("SubCategory", subCategorySc);

module.exports = SubCategory;
