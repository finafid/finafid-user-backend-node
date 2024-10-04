const mongoose = require("mongoose");
const schema = mongoose.Schema;
const fashionBlogSchema = new schema(
  {
    caption: {
      type: String,
      required: true,
    },
    productList:[ {
      type: schema.Types.ObjectId,
      ref: "",
      required: false,
    }],
    logoUrl: {
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
