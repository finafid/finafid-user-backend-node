const User = require("../../models/auth/userSchema");
const {
  sendMail,
  oneMinuteExpiry,
  threeMinuteExpiry,
} = require("../../utils/mailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Otp = require("../../models/auth/sendOtp");
const BlackList = require("../../models/auth/blackList");
const Cart = require("../../models/productBag/cartSc");
const WishList = require("../../models/productBag/wishListSc");
const Admin =require("../../models/Auth admin/adminSchema")
const {redeemedReferral}=require("../../controllers/auth/referralCon")
const {
  generateStringOfImageList,
  compressAndResizeImage,
} = require("../../utils/fileUpload");
const { adminDetails } = require("../auth _admin/authAdmin");

const userRegistration = async (req, res) => {
  const { email, phone ,referralCode} = req.body;
  const userDetails = await User.findOne({
    $or: [
      { email, is_Active: true },
      { phone, is_Active: true },
    ],
  });
  console.log(userDetails);
  if (userDetails) {
    return res.status(400).json({
      message: "Account is already Register",
      success: false,
    });
  }
  const newUser = new User(req.body);
  
  newUser.password = await bcrypt.hash(req.body.password, 10);
  try {
    await newUser.save();
    newUser.password = undefined;
     if (referralCode) {
       await redeemedReferral(referralCode, newUser._id);
     }
    return res.status(201).json({ message: "success", data: newUser });
  } catch (err) {
    return res.status(500).json({ message: "error", error: err.message });
  }
};
function generateTokens(tokenObject,user) {
  const accessToken = jwt.sign(tokenObject, process.env.SECRET, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign(tokenObject, process.env.SECRET, {
    expiresIn: "365d",
  });
  return { accessToken, refreshToken };
}
const userLogin = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email, is_Active: true });
    if (user && user.blocking==true) {
         return res
          .status(401)
          .json({ message: "Your account is permanently blocked" });
      }
      console.log(req.body)
      if (!user) {
        return res
          .status(401)
          .json({ message: "Auth failed,Invalid Email and Password" });
      }
    const isPassEqual = await bcrypt.compare(req.body.password, user.password);
    if (!isPassEqual) {
      return res
        .status(401)
        .json({ message: "Auth failed,Invalid Email and Password" });
    }
    const tokenObject = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
    };
    const jwtToken = generateTokens(tokenObject, user);
    const { fcmToken } = req.body;
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }
    tokenObject.imgUrl = user.imgUrl;
    return res.status(200).json(jwtToken);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const mailVarification = async (req, res) => {
  try {
    if (req.query.id == undefined) {
      return res.status(500).json({
        message: "error",
        err,
      });
    }
    const userData = await User.findOne({ _id: req.query.id });
    if (userData) {
      if (userData.email_validation == true) {
        return res.status(200).json({
          message: "Mail Already varified",
          err,
        });
      }
      User.findByIdAndUpdate({ _id: req.query.id }),
        {
          $set: { email_validation: true },
        };
      return res.status(200).json({
        message: "Mail varified success fully",
      });
    } else {
      return res.status(500).json({
        message: "User not found",
        err,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "error",
      err,
    });
  }
};
const genOtp = async () => {
  return Math.floor(1000 + Math.random() * 9000);
};
const sendMailVarification = async (req, res) => {
  try {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
      return res.status(500).json({
        success: false,
        message: "Error in request",
      });
    }

    const { email } = req.body;
    const userData = await User.findOne({ email, is_Active: true, blocking:false });
    if (!userData) {
      return res.status(500).json({
        success: false,
        message: "User is not present",
      });
    }

    if (userData.email_validation === true) {
      return res.status(200).json({
        success: true,
        message: "Email is already varified",
      });
    }

    const g_otp = await genOtp();
    console.log(g_otp);
    const cDate = new Date();
    const oldOtpData = await Otp.findOne({ email: userData.email });

    if (oldOtpData) {
      const sendNextOtp = await oneMinuteExpiry(oldOtpData.timestamp);
      if (!sendNextOtp) {
        return res.status(500).json({
          success: false,
          message: "Time is less than expected",
        });
      }
    }

    await Otp.findOneAndUpdate(
      { email: userData.email },
      { otp: g_otp, timestamp: new Date(cDate.getTime()) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const msg = `<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
            <p style="margin-bottom: 10px;">Dear ${userData.fullName},</p>
            <p style="margin-bottom: 10px;">The OTP for your email is ${g_otp}.</p>
            <p style="margin-bottom: 10px;">Best regards,</p>
            <p style="margin-bottom: 0;">The Finafid Team</p>
        </div>`;

   const mail= await sendMail(userData.email, "Email Verification", msg);
   console.log(mail);

    return res.status(200).json({
      success: true,
      message: "Otp is send to the email",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error occurred",
      error: err.message,
    });
  }
};
const sendMailVerificationForForgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
      return res.status(500).json({
        success: false,
        message: "Error in request",
      });
    }

    const { email } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(500).json({
        success: false,
        message: "User is not present",
      });
    }
    const g_otp = await genOtp();
    console.log(g_otp);
    const cDate = new Date();
    const oldOtpData = await Otp.findOne({ email: userData.email });

    if (oldOtpData) {
      const sendNextOtp = await oneMinuteExpiry(oldOtpData.timestamp);
      if (!sendNextOtp) {
        return res.status(500).json({
          success: false,
          message: "Time is less than expected",
        });
      }
    }

    await Otp.findOneAndUpdate(
      { email: userData.email },
      { otp: g_otp, timestamp: new Date(cDate.getTime()) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const msg = `<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
            <p style="margin-bottom: 10px;">Dear ${userData.fullName},</p>
            <p style="margin-bottom: 10px;">The OTP for your email is ${g_otp}.</p>
            <p style="margin-bottom: 10px;">Best regards,</p>
            <p style="margin-bottom: 0;">The [Your Company] Team</p>
        </div>`;

    await sendMail(userData.email, "Email Verification", msg);

    return res.status(200).json({
      success: true,
      message: "Otp is send to the email",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error occurred",
      error: err.message,
    });
  }
};

const varifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(500).json({
        success: false,
        message: "Error is there in the code ",
      });
    }
    const { email, otp } = req.body;
    const otpData = await Otp.findOne({
      email,
      otp,
    });
    console.log(email, otp);
    if (!otpData) {
      return res.status(500).json({
        success: false,
        message: "No otp data is found",
      });
    }
    const isOtpExpired = await threeMinuteExpiry(otpData.timestamp);
    if (isOtpExpired) {
      return res.status(400).json({
        success: false,
        message: "Otp is expired",
      });
    }
    await User.findOneAndUpdate(
      {
        email: email,
      },
      {
        $set: {
          email_validation: true,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Account varified succesfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal error is found",
    });
  }
};

const updatePasswordForResetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(500).json({
        success: false,
        message: "Error in the function",
      });
    }
    console.log(errors);
    const { email, password } = req.body;
    const newPassword = await bcrypt.hash(password, 10);
    console.log(newPassword);
    const userData = await User.findOneAndUpdate(
      { email: email },
      {
        $set: {
          password: newPassword,
        },
      },
      { new: true }
    );
    console.log(userData);
    if (!userData) {
      return res.status(500).json({
        success: false,
        message: "User is not present",
      });
    }
    await userData.save();
    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server error",
    });
  }
};
const logout = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(500).json({
        success: false,
        message: "error",
        err,
      });
    }
    const token =
      req.body.token || req.query.token || req.headers["authorization"];
    if (!token) {
      return res.status(403).json({
        success: false,
        msg: "Token is not present",
      });
    }
    const bearer = token.split(" ");
    const bToken = bearer[1];
    const newBlackList = new BlackList({
      token: bToken,
    });
    await newBlackList.save();
    return res.status(201).json({
      success: true,
      message: "Logout successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error",
      err,
    });
  }
};

const userDetails = async (req, res) => {
  try {
    console.log(req.user);
    const user = await User.findById({ _id: req.user._id }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // user.password = undefined;
    const cartDetails = await Cart.findOne({ UserId: req.user._id }).lean();
    // if(!cartDetails){
    //     return res.status(404).json({ message: 'No cart not found' });
    // }
    const wishListDetails = await WishList.findOne({
      UserId: req.user._id,
    }).lean();
    // if(!wishListDetails){
    //     return res.status(404).json({ message: 'No wishList Details not found' });
    // }
    user.cartDetails = cartDetails;
    user.wishListDetails = wishListDetails;
    user[cartDetails] = cartDetails;
    user[wishListDetails] = wishListDetails;
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const renewToken = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getRefreshToken = async (req, res) => {
  try {
    const userId = req.body.user._id;
    const userData = User.findById({
      _id: userId,
    });
    if (!userData) {
      res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const updateUserDetails = async (req, res) => {
  try {
    const userDetails = await User.findOne({ _id: req.user._id });

    const { fullName, gender } = req.body;

    if (fullName) {
      userDetails.fullName = fullName;
      await userDetails.save();
    }

    if (gender) {
      userDetails.gender = gender;
      await userDetails.save();
    }
    console.log(req.file);
    if (req.file) {
      const inputImagePath = req.file.buffer;
      const width = 800;
      const compressionQuality = 5;
      const extention = req.file.originalname.split(".")[1];
      const imageBuffer = await compressAndResizeImage(
        inputImagePath,
        extention,
        width,
        compressionQuality
      );
      req.file.originalname =
        req.file.originalname.split(".")[0].split(" ").join("-") +
        "-" +
        Date.now() +
        "." +
        extention;
      const imgUrl =
        "https://d2w5oj0jmt3sl6.cloudfront.net/" + req.file.originalname;
      console.log(imgUrl);
      userDetails.imgUrl = imgUrl;
      await userDetails.save();
      generateStringOfImageList(imageBuffer, req.file.originalname, res);
    }
    console.log(userDetails);
    return res.status(200).json(userDetails);
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const updateEmail = async (req, res) => {
  try {
    const userDetails = await User.findOne({
      _id: req.user._id,
    });
    if (!userDetails) {
      return res.status(500).json({ message: "No user found" });
    }
    userDetails.email = req.body.email;
    await userDetails.save();
    return res.status(200).json({ message: "User saved successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const updateNotification = async (req, res) => {
  try {
    const userDetails = await User.findOne({
      _id: req.user._id,
    });
    if (!userDetails) {
      return res.status(500).json({ message: "No user found" });
    }
    userDetails.push_notification = req.body.push_notification;
    await userDetails.save();
    return res.status(200).json({ message: "User saved successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const deleteUserAccount=async(req,res)=>{
  try {
    const userDetails=await User.findById(req.params.userId)
    if(!userDetails){
      return res
        .status(500)
        .json({ message: "User is not present" });
    }
    userDetails.is_Active=false;
    await userDetails.save();
    return res
      .status(200)
      .json({ message: "Account deleted successfully" });
  
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
}
const deleteUserAccountFromUser=async(req,res)=>{
  try {
    const userDetails = await User.findById(req.user._id);
    if (!userDetails) {
      return res.status(500).json({ message: "User is not present" });
    }
    userDetails.is_Active = false;
    await userDetails.save();
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
}
// Function to verify the refresh token
function verifyRefreshToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.SECRET, (err, payload) => {
      if (err) return reject(err);
      resolve(payload);
    });
  });
}

// Express route to refresh tokens
const verify_Refresh_Token = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(400).send("Refresh Token Required");

  try {
    const payload = await verifyRefreshToken(refreshToken);
    console.log(payload);
    const userDetails = await User.findById(payload._id);
    const adminDetails = await Admin.findById(payload._id);
     let tokens={}
    let tokenObject={}
    if(userDetails){
        tokenObject = {
         _id: userDetails._id,
         fullname: userDetails.fullname,
         email: userDetails.email,
       };
      tokens = generateTokens(tokenObject, userDetails);
    }
    if (adminDetails) {
      tokenObject = {
        _id: adminDetails._id,
        fullname: adminDetails.fullname,
        email: adminDetails.email,
      };
      tokens = generateTokens(tokenObject, userDetails);
    }
    res.json(tokens);
  } catch (error) {
    res.status(403).send(error.message);
  }
};
const validAccessToken=async(req,res)=>{
  try {
    
    const accessToken = req.body.token;
    console.log(accessToken);
    const decodedData = jwt.verify(accessToken, process.env.SECRET);
    console.log(decodedData);
    req.user = decodedData;
    const userDetails = await User.findById(req.user._id);
    const adminDetails = await Admin.findById(req.user._id);
    if (!userDetails && !adminDetails) {
      return res.status(401).send("Invalid Refresh Token");
    }
    return res.status(200).send("valid Refresh Token");
  } catch (error) {
    res.status(401).json({message:error.message});
  }
}

module.exports = {
  userRegistration,
  userLogin,
  mailVarification,
  sendMailVarification,
  varifyOtp,
  updatePasswordForResetPassword,
  logout,
  userDetails,
  getRefreshToken,
  sendMailVerificationForForgotPassword,
  updateUserDetails,
  updateEmail,
  updateNotification,
  deleteUserAccount,
  deleteUserAccountFromUser,
  verify_Refresh_Token,
  validAccessToken,
};
