const mongoose=require("mongoose")
const schema = mongoose.Schema;
const fashionCategorySchema = new schema(
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
    is_active: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);
const FashionCategory = mongoose.model(
  "FashionCategory",
  fashionCategorySchema
);
module.exports = FashionCategory;