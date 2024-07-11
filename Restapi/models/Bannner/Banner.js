const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
  position: {
    type: String,
    required: true,
    enum: ["Top", "Bottom ", "Middle","Pop_up"],
  },
  details: {
    resourceType: {
      type: String,
      required: true,
      enum: [
        "Brand",
        "Category ",
        "Subcategory",
        "ProductType",
        "Home",
        "About",
        "Contact",
      ],
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
  is_published: {
    type: Boolean,
    required: false,
    default:false
  },
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
