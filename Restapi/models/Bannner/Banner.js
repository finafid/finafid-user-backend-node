const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
  bannerType: {
    type: String,
    required: true,
    enum: ["Main Banner", "Footer Banner", "Popup Banner"],
  },
  details: {
    type: Schema.Types.Mixed,
    required: true,
  },
  linkUrl: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
    required: true,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
