const jwtToken = require("jsonwebtoken");
const BlackList = require("../models/auth/blackList");
const Admin = require("../models/Auth admin/adminSchema");

const verifyAdminToken = async (req, res, next) => {
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
    const blackList = await BlackList.findOne({ token });
    if (blackList) {
      return res
        .status(400)
        .json({ success: false, msg: "The token is expired already" });
    }

    // Verify the JWT token
    const decodedData = jwtToken.verify(token, process.env.SECRET, {
      algorithms: ["HS256"],
    });

     // console.log("Decoded Token Data:", decodedData);

    // Fetch admin details
    const adminDetails = await Admin.findOne({
      _id: decodedData._id
    });

     // console.log("Admin Details:", adminDetails);

    if (!adminDetails) {
      return res.status(404).json({
        success: false,
        msg: "Admin not found or inactive.",
      });
    }

    // Attach admin details to the request object
    req.admin = adminDetails;

    // Proceed to the next middleware
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, msg: error.message + " Invalid token" });
  }
};

module.exports = verifyAdminToken;
