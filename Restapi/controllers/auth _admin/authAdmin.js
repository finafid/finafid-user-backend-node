const { response } = require("express");
const User = require("../../models/auth/userSchema"); 
const { sendMail, oneMinuteExpiry, threeMinuteExpiry } = require("../../utils/mailer")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator");
const Otp = require("../../models/auth/sendOtp")
const BlackList = require("../../models/auth/blackList")
const Cart=require("../../models/productBag/cartSc")
const WishList=require("../../models/productBag/wishListSc")
const { genarateStringOfImageList ,compressAndResizeImage} = require('../../utils/fileUpload')


const userRegistration = async (req, res) => {
    const {email,phone}=req.body;
    const userDetails=await User.findOne({$or:[{email},{phone}]})
    
    if(userDetails){
        return res.status(400).json({
            message: 'Account is already Register',
            success:false});
    }
    const newUser = new User(req.body); 

    newUser.password = await bcrypt.hash(req.body.password, 10);
    try {
       
        await newUser.save()
        
        newUser.password = undefined;
        return res.status(201).json({ message: 'success', data: newUser });
    } catch (err) {
        return res.status(500).json({ message: 'error', error: err.message });
    }
};
const userLogin = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(401)
                .json({ message: 'Authy failed,Invalid Email and Password' })
        }
        const isPassEqual = await bcrypt.compare(req.body.password, user.password)
        if (!isPassEqual) {
            return res.status(401)
                .json({ message: 'Authy failed,Invalid Email and Password' })
        }
        const tokenObject = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
           
        }
        const jwtToken = jwt.sign(tokenObject, process.env.SECRET, { expiresIn: '10h' });
        tokenObject.imgUrl= user.imgUrl
        return res.status(200).json({
            token: jwtToken
        })
    } catch (err) {
        return res.status(500).json({
            message: 'error', err
        });
    }
};

const mailVarification = async (req, res) => {
    try {
        if (req.query.id == undefined) {
            return res.status(500).json({
                message: 'error', err
            });
        }
        const userData = await User.findOne({ _id: req.query.id });
        if (userData) {
            if (userData.email_validation == true) {
                return res.status(200).json({
                    message: 'Mail Already varified', err
                })
            }
            User.findByIdAndUpdate({ _id: req.query.id }), {
                $set: { email_validation: true }
            }
            return res.status(200).json({
                message: 'Mail varified success fully'
            })

        } else {
            return res.status(500).json({
                message: 'User not found', err
            })
        }

    } catch (err) {
        return res.status(500).json({
            message: 'error', err
        });
    }
}
const genOtp = async () => {
    return Math.floor(1000 + Math.random() * 9000)
}
const sendMailVarification = async (req, res) => {
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
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(500).json({
                success: false,
                message: 'User is not present'
            });
        }

        if (userData.email_validation === true) {
            return res.status(200).json({
                success: true,
                message: 'Email is already varified'
            });
        }

        const g_otp = await genOtp();
        console.log(g_otp)
        const cDate = new Date();
        const oldOtpData = await Otp.findOne({ email: userData.email });
       
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
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(500).json({
                success: false,
                message: 'User is not present'
            });
        }
        const g_otp = await genOtp();
        console.log(g_otp)
        const cDate = new Date();
        const oldOtpData = await Otp.findOne({ email: userData.email });
       
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

const varifyOtp = async (req, res) => {
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
        await User.findOneAndUpdate({
            email:email
        }, {
            $set: {
                email_validation: true
            }
        },{ new: true });
        return res.status(200).json({
            success: true,
            message: 'Account varified succesfully'
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
        const userData=await User.findOneAndUpdate({email:email},{
            $set:{
                password:newPassword
            }
        },{ new: true })
        console.log(userData)
        if (!userData) {
            return res.status(500).json({
                success: false,
                message: 'User is not present'
            });
        }
        await userData.save();
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

const userDetails=async(req,res)=>{
    try{
        console.log(req.user)
        const user = await User.findById({_id:req.user._id}).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // user.password = undefined;
        const cartDetails=await Cart.findOne({UserId:req.user._id}).lean();
        // if(!cartDetails){
        //     return res.status(404).json({ message: 'No cart not found' });
        // }
        const wishListDetails=await WishList.findOne({UserId:req.user._id}).lean();
        // if(!wishListDetails){
        //     return res.status(404).json({ message: 'No wishList Details not found' });
        // }
        user.cartDetails = cartDetails;
        user.wishListDetails = wishListDetails;
        user[cartDetails]=cartDetails
        user[wishListDetails]=wishListDetails
        res.status(200).json(user);
    }catch(error){
        res.status(500).json({ message: error.message +' Internal Server Error' });
    }
}
const renewToken=async(req,res)=>{
    try{
        
    }
    catch(error){
        res.status(500).json({ message: error.message +' Internal Server Error' });
    }
}
const getRefreshToken=async(req,res)=>{
    try{
        const userId=req.body.user._id;
        const userData=User.findById({
            _id:userId
        })
        if(!userData){
            res.status(500).json({ message: error.message +' Internal Server Error' });
        }

    }
    catch(error){
        res.status(500).json({ message: error.message +' Internal Server Error' });
    }
}
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
            userDetails.imgUrl = imgUrl;
            await userDetails.save()
            genarateStringOfImageList(imageBuffer, req.file.originalname, res);
        }
        console.log(userDetails)
        return res.status(200).json(userDetails);
    } catch (error) {
        return res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
};

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
    updateUserDetails
}
