const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mainCategorySchema = new Schema(
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
    is_featured: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

const MainCategory = mongoose.model("MainCategory", mainCategorySchema);

module.exports = MainCategory; // Export the Product model
