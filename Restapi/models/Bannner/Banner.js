const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
    required: true,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Brand;
