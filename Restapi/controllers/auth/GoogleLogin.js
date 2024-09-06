const { google } = require("googleapis");
const User=require("../../models/auth/userSchema")
const oauth2Client = new google.auth.OAuth2(
  process.env.google_clientId,
  process.env.google_clientSecret,
  "https://finafid-backend-node-e762fd401cc5.herokuapp.com/api/v1/google/callback"
);
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];
const jwt = require("jsonwebtoken");
function generateTokens(tokenObject) {
  const accessToken = jwt.sign(tokenObject, process.env.SECRET, {
    expiresIn: "7d",
  });
  const refreshToken = jwt.sign(tokenObject, process.env.SECRET, {
    expiresIn: "365d",
  });
  return { accessToken, refreshToken };
}
const loginWithGoogle = (req, res) => {
  try {
    // Generate a URL that asks for profile and email permissions
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: GOOGLE_SCOPES,
    });
    // Redirect to the auth URL
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Google callback function || method GET
const googleCallback = async (req, res) => {
  try {
    // Validate the request
    if (!req.query.code) {
      return res.status(400).send({
        success: false,
        message: "Invalid request",
      });
    }

    // Get the access token from the code
    const { tokens } = await oauth2Client.getToken(req.query.code);
    // Set the credentials
    oauth2Client.setCredentials(tokens);
    // Set the auth token
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    // Get user info from Google
    const { data } = await oauth2.userinfo.get();

    // Check if the user already exists
    let user = await User.findOne({ email: data.email }).select("-password");

    // If the user doesn't exist, create a new one; otherwise, log in
    if (!user) {
      user = await new User({
        fullName: data.name,
        email: data.email,
        googleId: data.id,
        email_validation: data.verified_email,
        phone:90909090,
        password:"Google123"
      }).save();
    } else {
      // Update the Google ID if it doesn't exist
      if (!user.googleId) {
        user.googleId = data.id;
        await user.save();
      }
    }

    // Create a payload to store in JWT
    const payload = {
      user: {
        _id: user._id,
        email: data.email,
        fullname: data.name,
      },
    };

    // Generate a JWT token
    const token = await generateTokens(payload);

    return res.status(200).send({
      success: true,
      message: "User Logged in Successfully",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  googleCallback,
  loginWithGoogle,
};
