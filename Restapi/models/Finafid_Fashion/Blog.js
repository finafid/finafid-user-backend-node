const mongoose = require("mongoose");
const schema = mongoose.Schema;
const fashionBlogSchema = new schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      required: true,
    },
    fashionCategory: {
      type: schema.Types.ObjectId,
      ref: "FashionCategory",
      required: false,
    },
    userName: {
      type: String,
    },
    profileImg: {
      type: String,
    },
  },
  { timestamps: true }
);
const FashionBlog = mongoose.model("FashionBlog", fashionBlogSchema);
module.exports = FashionBlog;
