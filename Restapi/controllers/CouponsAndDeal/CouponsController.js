const Coupons=require("../../models/Coupons/coupons")
const UserCouponUsage = require("../../models/Coupons/couponsUses");
const createCoupons = async (req, res) => {
  try {
    const coupon = new Coupons({
      couponType: req.body.couponType,
      title: req.body.title,
      code: req.body.code,
      Coupon_Bearer: req.body.Coupon_Bearer,
      Customer: req.body.Customer,
      Limit_For_Same_User: req.body.Limit_For_Same_User,
      Discount_Type: req.body.Discount_Type,
      Discount_Value: req.body.Discount_Value,
      Minimum_Purchase: req.body.Minimum_Purchase,
      Maximum_Purchase: req.body.Maximum_Purchase,
      Start_Date: req.body.Start_Date,
      Expire_Date: req.body.Expire_Date,
    });

    const savedCoupon = await coupon.save();
    res.status(201).json({message:true,
        savedCoupon});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
const getTheCoupon = async (req, res) => {
  try {
    const coupon = await Coupons.findById(req.params.couponId);
    if (coupon == null) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const applyCoupon = async (req, res) => {
  try {
    const { code, userId, orderAmount } = req.body;

    const coupon = await Coupons.findOne({ code: code });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const currentDate = new Date();
    if (currentDate < coupon.Start_Date || currentDate > coupon.Expire_Date) {
      return res
        .status(400)
        .json({ message: "Coupon is expired or not valid yet" });
    }

    if (orderAmount < coupon.Minimum_Purchase) {
      return res
        .status(400)
        .json({
          message: `Order amount must be at least ${coupon.Minimum_Purchase}`,
        });
    }

    const userCouponUsage = await UserCouponUsage.findOne({
      userId: userId,
      couponCode: code,
    });
    if (
      userCouponUsage &&
      userCouponUsage.usageCount >= coupon.Limit_For_Same_User
    ) {
      return res
        .status(400)
        .json({ message: "Coupon usage limit exceeded for this user" });
    }
    let discountAmount;
    if (coupon.Discount_Type === "Percentage") {
      discountAmount = (orderAmount * coupon.Discount_Value) / 100;
    } else if (coupon.Discount_Type === "Fixed") {
      discountAmount = coupon.Discount_Value;
    }

    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

  
    if (userCouponUsage) {
      userCouponUsage.usageCount += 1;
      await userCouponUsage.save();
    } else {
      const newUserCouponUsage = new UserCouponUsage({
        userId: userId,
        couponCode: code,
        usageCount: 1,
      });
      await newUserCouponUsage.save();
    }

    res.status(200).json({
      message: "Coupon applied successfully",
      discountAmount: discountAmount,
      finalAmount: orderAmount - discountAmount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getAllCoupons=async(req,res)=>{
  try {
    const couponsDetails=await Coupons.find()
    return res.status(200).json({ couponsDetails });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
const updateCoupons = async (req, res) => {
  try {
    const { couponsId } = req.params;
    const updatedData = {
      couponType: req.body.couponType,
      title: req.body.title,
      code: req.body.code,
      Coupon_Bearer: req.body.Coupon_Bearer,
      Customer: req.body.Customer,
      Limit_For_Same_User: req.body.Limit_For_Same_User,
      Discount_Type: req.body.Discount_Type,
      Discount_Value: req.body.Discount_Value,
      Minimum_Purchase: req.body.Minimum_Purchase,
      Maximum_Purchase: req.body.Maximum_Purchase,
      Start_Date: req.body.Start_Date,
      Expire_Date: req.body.Expire_Date,
    };

    const updatedCoupon = await Coupons.findByIdAndUpdate(
      couponsId,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(200).json({ message: true, updatedCoupon });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteCoupons = async (req, res) => {
  try {
     const { couponId } = req.params;
     const couponsDetails = await Coupons.findByIdAndDelete(couponId);
      return res.status(200).json({ message:"Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const updateStatusCoupons = async (req, res) => {
  try {
    const dealDetails = await Coupons.findOne({
      _id: req.params.couponId,
    });

    if (req.body) {
      dealDetails.status = req.body.status;
    }
    await dealDetails.save();
    return res.status(200).json({
      success: true,
      message: "edited successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
module.exports = {
  createCoupons,
  getTheCoupon,
  applyCoupon,
  updateCoupons,
  deleteCoupons,
  getAllCoupons,
  updateStatusCoupons,
};