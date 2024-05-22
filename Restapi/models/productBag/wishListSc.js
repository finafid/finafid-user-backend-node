const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product = require("../../models/product/productSc");
const User = require("../../models/auth/userSchema");

const wishListSchema = new Schema(
  {
    productIdList: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    UserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const WishList = mongoose.model("WishList", wishListSchema);

module.exports = WishList;
