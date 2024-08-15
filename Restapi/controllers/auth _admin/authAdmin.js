const { response } = require("express");
const Admin = require("../../models/Auth admin/adminSchema"); 
const { sendMail, oneMinuteExpiry, threeMinuteExpiry } = require("../../utils/mailer")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator");
const Otp = require("../../models/auth/sendOtp")
const BlackList = require("../../models/auth/blackList")
const Cart=require("../../models/productBag/cartSc")
const WishList=require("../../models/productBag/wishListSc")
const { genarateStringOfImageList ,compressAndResizeImage} = require('../../utils/fileUpload')


const adminRegistration = async (req, res) => {
  const { email, phone } = req.body;
  const adminDetails = await Admin.findOne({ $or: [{ email }, { phone }] });

  if (adminDetails) {
    return res.status(400).json({
      message: "Account is already Register",
      success: false,
    });
  }
  const newAdmin = new Admin(req.body);

  newAdmin.password = await bcrypt.hash(req.body.password, 10);
  try {
    await newAdmin.save();

    newAdmin.password = undefined;
    return res.status(201).json({ message: "success", data: newAdmin });
  } catch (err) {
    return res.status(500).json({ message: "error", error: err.message });
  }
};
function generateTokens(tokenObject, user) {
  const accessToken = jwt.sign(tokenObject, process.env.SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(tokenObject, process.env.SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
}
const adminLogin = async (req, res) => {
    try {
        const adminDetails = await Admin.findOne({ email: req.body.email });
        if (!adminDetails) {
          return res
            .status(401)
            .json({ message: "Auth failed,Invalid Email and Password" });
        }
        const isPassEqual = await bcrypt.compare(
          req.body.password,
          adminDetails.password
        );
        if (!isPassEqual) {
            return res.status(401)
                .json({ message: 'Auth failed,Invalid Email and Password' })
        }
        const tokenObject = {
          _id: adminDetails._id,
          fullname: adminDetails.fullname,
          email: Admin.email,
        };
        const jwtToken = generateTokens(tokenObject,adminDetails);
        tokenObject.imgUrl = Admin.imgUrl;
        return res.status(200).json(jwtToken);
    } catch (err) {
        return res.status(500).json({
            message: err.message+"Internal server error"
        });
    }
};

const genOtp = async () => {
    return Math.floor(1000 + Math.random() * 9000)
}
const sendMailVerificationAdmin = async (req, res) => {
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
    const adminData = await Admin.findOne({ email });
    console.log(adminData);
    if (!adminData) {
      return res.status(500).json({
        success: false,
        message: "Admin is not present",
      });
    }

    if (adminData.email_validation === true) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
      });
    }

    const g_otp = await genOtp();
    console.log(g_otp);
    const cDate = new Date();
    const oldOtpData = await Otp.findOne({ email: adminData.email });

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
      { email: adminData.email },
      { otp: g_otp, timestamp: new Date(cDate.getTime()) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const msg = `<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
            <p style="margin-bottom: 10px;">Dear ${adminData.fullName},</p>
            <p style="margin-bottom: 10px;">The OTP for your email is ${g_otp}.</p>
            <p style="margin-bottom: 10px;">Best regards,</p>
            <p style="margin-bottom: 0;">The [Your Company] Team</p>
        </div>`;

    await sendMail(adminData.email, "Email Verification", msg);

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
const sendMailVerificationForForgotPassword=async(req,res)=> {
    try {
        const errors = validationResult(req);
        console.log(errors);
        if (!errors.isEmpty()) {
            return res.status(500).json({
                success: false,
                message: 'Error in request'
            });
        }

        const { email } = req.body;
        const adminData = await Admin.findOne({ email });
        if (!adminData) {
          return res.status(500).json({
            success: false,
            message: "Admin is not present",
          });
        }
        const g_otp = await genOtp();
        console.log(g_otp)
        const cDate = new Date();
        const oldOtpData = await Otp.findOne({ email: adminData.email });
       
        if (oldOtpData) {
            const sendNextOtp = await oneMinuteExpiry(oldOtpData.timestamp);
            if (!sendNextOtp) {
                return res.status(500).json({
                    success: false,
                    message: 'Time is less than expected'
                });
            }
        }

        await Otp.findOneAndUpdate(
          { email: adminData.email },
          { otp: g_otp, timestamp: new Date(cDate.getTime()) },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const msg = `<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
            <p style="margin-bottom: 10px;">Dear ${adminData.fullName},</p>
            <p style="margin-bottom: 10px;">The OTP for your email is ${g_otp}.</p>
            <p style="margin-bottom: 10px;">Best regards,</p>
            <p style="margin-bottom: 0;">The [Your Company] Team</p>
        </div>`;

        await sendMail(adminData.email, "Email Verification", msg);

        return res.status(200).json({
            success: true,
            message: 'Otp is send to the email'
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Error occurred',
            error: err.message
        });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(500).json({
                success: false,
                message: 'Error is there in the code ', 
            });
        }
        const { email, otp } = req.body;
        const otpData = await Otp.findOne({
            email,
            otp
        })
        console.log(email,otp)
        if (!otpData) {
            return res.status(500).json({
                success: false,
                message: 'No otp data is found', 
            });
        }
        const isOtpExpired = await threeMinuteExpiry(otpData.timestamp)
        if (isOtpExpired) {
            return res.status(400).json({
                success: false,
                message: 'Otp is expired', 
            });
        }
        await Admin.findOneAndUpdate({
            email:email
        }, {
            $set: {
                email_validation: true
            }
        },{ new: true });
        return res.status(200).json({
            success: true,
            message: 'Account verified successfully'
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message +' Internal error is found', 
        });
    }
}

const updatePasswordForResetPassword=async(req,res)=>{
    try{
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(500).json({
                success: false,
                message: 'Error in the function',
            });
        }
        console.log(errors)
        const  {email,password}=req.body;
        const newPassword = await bcrypt.hash(password, 10);
        console.log(newPassword)
        const adminData=await Admin.findOneAndUpdate({email:email},{
            $set:{
                password:newPassword
            }
        },{ new: true })
        console.log(adminData);
        if (!adminData) {
          return res.status(500).json({
            success: false,
            message: "admin is not present",
          });
        }
        await adminData.save();
        return res.status(200).json({
            success: true,
            message:'Password updated successfully', 
        });
    }catch (error) {
        return res.status(500).json({
            success: false,
            message:error.message + ' Internal Server error', 
        });
    }
}
const logout=async(req,res)=>{
    try{
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(500).json({
                success: false,
                message: 'error', err
            });
        }
        const token = req.body.token || req.query.token || req.headers["authorization"];
        if (!token) {
        return res.status(403).json({
            success: false,
            msg: "Token is not present"
        });
}
    const bearer = token.split(' ');
    const bToken = bearer[1];
    const newBlackList=new BlackList({
        token:bToken      
    })
    await newBlackList.save();
    return res.status(201).json({
        success:true,
        message:"Logout successfully"
    })

    }catch (error) {
        return res.status(500).json({
            success: false,
            message: 'error', err
        });
    }
}

const adminDetails=async(req,res)=>{
    try{
      
        const admin = await Admin.findById({_id:req.user._id}).select('-password');
        if (!admin) {
          return res.status(404).json({ message: "Admin not found" });
        }
       
        res.status(200).json(admin);
    }catch(error){
        res.status(500).json({ message: error.message +' Internal Server Error' });
    }
}

const updateAdminDetails = async (req, res) => {
    try {
        const adminDetails = await Admin.findOne({ _id: req.user._id });

        const { fullName, gender } = req.body;
        
        if (fullName) {
            adminDetails.fullName = fullName;
            await adminDetails.save();
        }

        if (gender) {
            adminDetails.gender = gender;
            await adminDetails.save();
        }
        console.log(req.file)
        if (req.file) {
          
            const inputImagePath = req.file.buffer;
            const width = 800;
            const compressionQuality = 5;
            const extention = req.file.originalname.split(".")[1];
            const imageBuffer = await compressAndResizeImage(inputImagePath, extention, width, compressionQuality);
            req.file.originalname = req.file.originalname.split(".")[0].split(" ").join("-") + "-" + Date.now() + "." + extention;
            const imgUrl = "https://d2w5oj0jmt3sl6.cloudfront.net/" + req.file.originalname;
            console.log(imgUrl)
            adminDetails.imgUrl = imgUrl;
            await adminDetails.save();
            genarateStringOfImageList(imageBuffer, req.file.originalname, res);
        }
        console.log(adminDetails);
        return res.status(200).json(adminDetails);
    } catch (error) {
        return res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
};

module.exports = {
  adminRegistration,
  adminLogin,
  sendMailVerificationAdmin,
  verifyOtp,
  updatePasswordForResetPassword,
  logout,
  adminDetails,
  sendMailVerificationForForgotPassword,
  updateAdminDetails,
};
