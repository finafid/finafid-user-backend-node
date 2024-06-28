const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wishListSchema = new Schema(
  {
    productIdList: [
      {
        type: Schema.Types.ObjectId,
        ref: "Variant",
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
