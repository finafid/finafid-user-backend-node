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
    const userData = await User.findById(req.user._id);
    let referralCode = "";
    referralCode = await Referral.findOne({
      userId: req.user._id,
    });
    if (!referralCode) {
      console.log("userData");
      const referral = await genReferralCode(req.user._id);
      referralCode = await Referral.findOne({
        userId: req.user._id,
      });
    }
    const referralLink =
      "https://finafid.com/auth" + "?referralCode="+referralCode.code;
    const email = req.body.email;
    const message = `<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
            <p style="margin-bottom: 10px;">Dear ${userData.fullName},</p>
            <p style="margin-bottom: 10px;">The Link for your email is ${referralLink}.</p>
            <p style="margin-bottom: 10px;">Best regards,</p>
            <p style="margin-bottom: 0;">The Finafid Team</p>
        </div>`;
    await sendMail(email, "Email Verification", message);
    return res.status(200).json({ message: "Send Successfully" });
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
