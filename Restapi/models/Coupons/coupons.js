const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema(
  {
    couponType: {
      type: String,
      enum: ["First Order", "Free Delivery", "Discount on Purchase"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    Coupon_Bearer: {
      type: String,
      required: true,
    },
    Customer: {
      type: String,
      required: true,
    },
    Limit_For_Same_User: {
      type: Number,
      required: true,
    },
    Discount_Type: {
      type: String,
      required: true,
    },
    Discount_Value: {
      type: Number,
      required: true,
    },
    Minimum_Purchase: {
      type: Number,
      required: true,
    },
    Maximum_Purchase: {
      type: Number,
      required: false,
    },
    Start_Date: {
      type: Date,
      required: true,
    },
    Expire_Date: {
      type: Date,
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const Coupons = mongoose.model("Coupons", couponSchema);

module.exports = Coupons;
