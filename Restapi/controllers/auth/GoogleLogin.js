const { google } = require("googleapis");
const User      = require("../../models/auth/userSchema");
const jwt       = require("jsonwebtoken");

// read from process.env
const CALLBACK_URL        = process.env.GOOGLE_CALLBACK_URL;
const FRONTEND_CALLBACK   = process.env.FRONTEND_CALLBACK_URL;

const oauth2Client = new google.auth.OAuth2(
  process.env.google_clientId,
  process.env.google_clientSecret,
  CALLBACK_URL                         // ← UPDATED
);

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

function generateTokens(tokenObject) {
  const accessToken  = jwt.sign(tokenObject, process.env.SECRET, { expiresIn: "7d" });
  const refreshToken = jwt.sign(tokenObject, process.env.SECRET, { expiresIn: "365d" });
  return { accessToken, refreshToken };
}

const loginWithGoogle = (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type:  "offline",
      response_type:"code",
      prompt:       "consent",
      scope:        GOOGLE_SCOPES,
    });
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({ success:false, message:error.message });
  }
};

const googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ success:false, message:"Invalid request" });
    }

    // exchange code → tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth:oauth2Client, version:"v2" });
    const { data } = await oauth2.userinfo.get();

    let user = await User.findOne({ email:data.email, is_Active:true });
    if (!user) {
      user = await new User({
        fullName:        data.name,
        email:           data.email,
        googleId:        data.id,
        email_validation:data.verified_email,
        phone:           90909090,
        password:        "Google123",
        imgUrl:          `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(data.name)}`
      }).save();
    } else if (!user.googleId) {
      user.googleId = data.id;
      await user.save();
    }

    const payload = { _id:user._id, fullname:user.fullName, email:user.email };
    const { accessToken, refreshToken } = generateTokens(payload);

    // ← UPDATED: send them back to your front-end URL
    const redirectTo = `${FRONTEND_CALLBACK}?success=true`
      + `&accessToken=${encodeURIComponent(accessToken)}`
      + `&refreshToken=${encodeURIComponent(refreshToken)}`;

    return res.redirect(redirectTo);
  } catch (error) {
    console.error(error);
    return res.redirect(`${FRONTEND_CALLBACK}?success=false`);
  }
};

module.exports = { loginWithGoogle, googleCallback };
