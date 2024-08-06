const Referral = require("../../models/auth/referral");
const { sendMail } = require("../../utils/mailer");
const User = require("../../models/auth/userSchema");
const genReferralCode = async (req, res) => {
  try {
    const userData = await User.findById(req.user._id);
    const fullNamePart = userData.fullName.toString().split(" ")[0];
    const code = fullNamePart + req.user._id.toString().substring(0, 6);
    const newReferral = new Referral({
      userId: req.user._id,
      email: userData.email,
      code,
    });
    if (!newReferral) {
      return res.status(500).json({ message: "Cannot create." });
    }
    await newReferral.save();
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const shareReferralCode = async (req, res) => {
  try {
    const userData = await User.findById(req.user._id);
    let referralCode = "";
    referralCode = await Referral.findOne({
      userId: req.user._id,
    });
    if (!referralCode) {
      console.log("userData");
      const referral = await genReferralCode(req);
      referralCode = await Referral.findOne({
        userId: req.user._id,
      });
    }
    const email = req.body.email;
    const message = `<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
            <p style="margin-bottom: 10px;">Dear ${userData.fullName},</p>
            <p style="margin-bottom: 10px;">The Code for your email is ${referralCode.code}.</p>
            <p style="margin-bottom: 10px;">Best regards,</p>
            <p style="margin-bottom: 0;">The Finafid Team</p>
        </div>`;
    await sendMail(email, "Email Verification", message);
    return res.status(200).json({ message: "Send Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const redeemedReferral = async (req, res) => {
  try {
    const couponsDetails = await Referral.findOne({
      code: req.body.code,
    });

    if (!couponsDetails) {
      return res.status(500).json({ message: "Cannot find." });
    }
    const referral = await genReferralCode(req);
    const userDetails = await Referral.findOne({
      userId: req.user._id,
    });
    userDetails.referred_by = couponsDetails.userId;
    await userDetails.save();

    if (req.user._id == couponsDetails.userId) {
      return res.status(500).json({ message: "Cannot refer yourself" });
    }
    couponsDetails.referred_user.forEach((element) => {
      if (element == req.user._id)
        return res.status(500).json({ message: "Cannot refer more than 1" });
    });
    couponsDetails.referred_user.push(req.user._id);
    await couponsDetails.save();
    return res.status(200).json({ message: "Successfully redeemed" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
module.exports = {
  shareReferralCode,
  redeemedReferral,
};
