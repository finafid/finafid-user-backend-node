const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userCouponUsageSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  couponCode: {
    type: String,
    required: true,
  },
  usageCount: {
    type: Number,
    required: true,
    default: 0,
  },
});

const UserCouponUsage = mongoose.model(
  "UserCouponUsage",
  userCouponUsageSchema
);

module.exports = UserCouponUsage;
