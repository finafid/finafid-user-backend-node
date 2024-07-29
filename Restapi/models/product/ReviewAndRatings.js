const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    imgLink: [
      {
        type: String,
        // required: true,
      },
    ],
    status: {
      type: String,
      required: false,
      default:true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
