const jwtToken = require("jsonwebtoken");
const BlackList = require("../models/auth/blackList");
const User = require("../models/auth/userSchema");
const Admin=require("../models/Auth admin/adminSchema")
const verifyToken = async (req, res, next) => {
  try {
    // Retrieve token from headers, query, or body
    let token =
      req.body.token || req.query.token || req.headers["authorization"];

    if (!token) {
      return res
        .status(403)
        .json({ success: false, msg: "Token is not present" });
    }

    // Handle "Bearer" prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    // Check if the token is blacklisted
    const blackListPromise = BlackList.findOne({ token });

    // Verify the JWT token
    const decodedData = jwtToken.verify(token, process.env.SECRET);
    req.user = decodedData;

    // Fetch user and admin details concurrently
    const [blackList, userDetails, adminDetails] = await Promise.all([
      blackListPromise,
      User.findOne({ _id: req.user._id, is_Active: true, blocking: false }),
      Admin.findOne({ _id: req.user._id }),
    ]);

    if (blackList) {
      return res
        .status(400)
        .json({ success: false, msg: "The token is expired already" });
    }

    if (!userDetails && !adminDetails) {
      return res
        .status(404)
        .json({ success: false, msg: "User or Admin not found" });
    }

    // Proceed to the next middleware
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, msg: error.message + " Invalid token" });
  }
};

module.exports = verifyToken;
