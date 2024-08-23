const jwtToken = require("jsonwebtoken");
const BlackList = require("../models/auth/blackList");
const User = require("../models/auth/userSchema");
const Admin=require("../models/Auth admin/adminSchema")
const verifyToken = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["authorization"];
  console.log(token);
  if (!token) {
    return res.status(403).json({
      success: false,
      msg: "Token is not present",
    });
  }
  try {
    const bearer = token.split(" ");
    const bToken = bearer[1];
    console.log(bToken);
    const blackList = await BlackList.findOne({
      token: token,
    });
    // console.log(blackList)
    if (blackList) {
      return res.status(400).json({
        success: false,
        msg: "The token is expired already",
      });
    }
    const decodedData = jwtToken.verify(bToken, process.env.SECRET);
    req.user = decodedData;
    const userDetails = await User.findOne({
      _id: req.user._id,
      is_Active: true,
      blocking: false,
    });
    const adminDetails = await Admin.findOne({
      _id: req.user._id,
    });
    if (userDetails || adminDetails) {
      next();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: error.message + " Invalid token",
    });
  }
};

module.exports = verifyToken;
