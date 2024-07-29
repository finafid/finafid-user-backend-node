const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const utsavGallerySchema = new Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MainCategory",
  },
  bannerImg: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  is_published: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const UtsavGallery = mongoose.model("UtsavGallery", utsavGallerySchema);

module.exports = UtsavGallery;
