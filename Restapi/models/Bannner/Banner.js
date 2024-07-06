const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
  position: {
    type: String,
    required: true,
    enum: ["Top", "Bottom ", "Middle"],
  },
  details: {
    resourceType: {
      type: String,
      required: true,
      enum: ["Brand", "Category ", "Subcategory","ProductType","Home","About","Contact"],
    },
    valueId: {
      type: String,
    required: true,
    },
  },
  linkUrl: {
      type: String,
      required: true,
    },
  bannerUrl: {
      type: String,
      required: true,
    },
  
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
