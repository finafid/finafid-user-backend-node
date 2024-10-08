const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
  position: {
    type: String,
    required: true,
    enum: [
      "Top",
      "Bottom",
      "Middle_1",
      "Middle_2",
      "Middle_3",
      "Middle_4",
      "Middle_1_app",
      "Middle_2_app",
      "Middle_3_app",
      "Middle_4_app",
      "Popup",
    ],
  },
  bannerType: {
    type: String,
    required: true,
    enum: [
      "Leaderboard",
      "Large Rectangle",
      "Medium Rectangle",
      "Wide Skyscraper",
      "Skyscraper",
      "Square",
      "Microbar",
      "Hero",
      "Small Rectangle",
      "Tinybar",
      "Landscape",
    ],
  },
  details: {
    resourceType: {
      type: String,
      required: true,
      enum: [
        "Brand",
        "Category",
        "Subcategory",
        "ProductType",
        "Home",
        "About",
        "Contact",
        "Utsav",
        "Product",
        "Search",
        "Flash Deal",
        "Featured Deal",
      ],
    },
    valueId: {
      type: String,
      required: false,
    },
  },
  linkUrl: {
    type: String,
    required: true,
  },
  bannerImg: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  bannerTitle: {
    type: String,
    required: false,
  },
  is_published: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
