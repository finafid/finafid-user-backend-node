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
