const Referral = require("../../models/auth/referral");
const { sendMail } = require("../../utils/mailer");
const User = require("../../models/auth/userSchema");
const genReferralCode = async (userId) => {
  try {
    const userData = await User.findById(userId);
    const fullNamePart = userData.fullName.toString().split(" ")[0];
    const code = fullNamePart + userId.toString().substring(0, 6);
    const newReferral = new Referral({
      userId,
      email: userData.email,
      code,
    });
    if (!newReferral) {
      return { message: "Cannot create." };
    }
    await newReferral.save();
  } catch (error) {
    return { message: error.message + " Internal Server Error" };
  }
};
const shareReferralCode = async (req, res) => {
  try {
    let referralCode = {};
    referralCode = await Referral.findOne({
      userId: req.user._id,
    });
    console.log({ referralCode: referralCode });
    if (!referralCode) {
      console.log("userData");
      const referral = await genReferralCode(req.user._id);
      console.log({ referral: referral });
      referralCode = await Referral.findOne({
        userId: req.user._id
      });
    }
    const referralLink = `https://finafid.com/designer/${encodeURIComponent(
      referralCode.code
    )}`;
    return res.status(200).json({ referralLink: referralLink });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
async function redeemedReferral(referralCode,userId) {
  try {
    console.log(referralCode);
    console.log(userId);
    const couponsDetails = await Referral.findOne({
      code: referralCode,
    });
    console.log({ couponsDetails: couponsDetails });
    if (!couponsDetails) {
      return res.status(500).json({ message: "Cannot find." });
    }
    await genReferralCode(userId);
    const userDetails = await Referral.findOne({
      userId: userId,
    });
    console.log({ userDetails: userDetails });
    userDetails.referred_by = couponsDetails.userId;
    await userDetails.save();

    if (userId == couponsDetails.userId) {
      return res.status(500).json({ message: "Cannot refer yourself" });
    }
    couponsDetails.referred_user.forEach((element) => {
      if (element == userId)
        return res.status(500).json({ message: "Cannot refer more than 1" });
    });
    couponsDetails.referred_user.push(userId);
    await couponsDetails.save();
    return couponsDetails;
  } catch (error) {
    return {
      message: error.message
    }; 
   }
};
module.exports = {
  shareReferralCode,
  redeemedReferral,
};
