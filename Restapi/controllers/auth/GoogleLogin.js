const { google } = require("googleapis")
const User = require("../../models/auth/userSchema")
const jwt = require("jsonwebtoken")

// read from process.env
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL
const FRONTEND_CALLBACK = process.env.FRONTEND_CALLBACK_URL
const MOBILE_CALLBACK = process.env.MOBILE_CALLBACK_URL // Add this to your .env

const oauth2Client = new google.auth.OAuth2(process.env.google_clientId, process.env.google_clientSecret, CALLBACK_URL)

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
]

function generateTokens(tokenObject) {
  const accessToken = jwt.sign(tokenObject, process.env.SECRET, { expiresIn: "7d" })
  const refreshToken = jwt.sign(tokenObject, process.env.SECRET, { expiresIn: "365d" })
  return { accessToken, refreshToken }
}

const loginWithGoogle = (req, res) => {
  try {
    // Check if this is a mobile request
    const { redirectUri, mobile } = req.query

    console.log("Google OAuth request:", { redirectUri, mobile })

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: GOOGLE_SCOPES,
      // Use the redirectUri from the mobile app if provided
      redirect_uri: redirectUri || CALLBACK_URL,
      // Add state parameter to track if this is mobile
      state: mobile ? JSON.stringify({ mobile: true, redirectUri }) : undefined,
    })

    console.log("Generated auth URL:", authUrl)

    // For mobile requests, return the URL instead of redirecting
    if (mobile || redirectUri) {
      return res.json({ url: authUrl })
    }

    // For web requests, redirect as before
    res.redirect(authUrl)
  } catch (error) {
    console.error("Login with Google error:", error)
    res.status(500).json({ success: false, message: error.message })
  }
}

const googleCallback = async (req, res) => {
  try {
    const code = req.query.code
    const state = req.query.state

    console.log("Google callback received:", { code: !!code, state })

    if (!code) {
      return res.status(400).json({ success: false, message: "Invalid request" })
    }

    // Parse state to check if this is a mobile request
    let isMobile = false
    let mobileRedirectUri = null

    if (state) {
      try {
        const parsedState = JSON.parse(state)
        isMobile = parsedState.mobile
        mobileRedirectUri = parsedState.redirectUri
      } catch (e) {
        console.log("Could not parse state, treating as web request")
      }
    }

    console.log("Processing callback:", { isMobile, mobileRedirectUri })

    // exchange code → tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" })
    const { data } = await oauth2.userinfo.get()

    console.log("Google user data:", { email: data.email, name: data.name })

    let user = await User.findOne({ email: data.email, is_Active: true })
    if (!user) {
      user = await new User({
        fullName: data.name,
        email: data.email,
        googleId: data.id,
        email_validation: data.verified_email,
        phone: 90909090,
        password: "Google123",
        imgUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      }).save()
      console.log("Created new user:", user._id)
    } else if (!user.googleId) {
      user.googleId = data.id
      await user.save()
      console.log("Updated existing user with Google ID")
    }

    const payload = { _id: user._id, fullname: user.fullName, email: user.email }
    const { accessToken, refreshToken } = generateTokens(payload)

    // Handle mobile vs web redirects
    if (isMobile && mobileRedirectUri) {
      // Mobile redirect with deep link
      const redirectTo =
        `${mobileRedirectUri}?success=true` +
        `&accessToken=${encodeURIComponent(accessToken)}` +
        `&refreshToken=${encodeURIComponent(refreshToken)}`

      console.log("Redirecting to mobile app:", redirectTo)
      return res.redirect(redirectTo)
    } else {
      // Web redirect (your existing logic)
      const redirectTo =
        `${FRONTEND_CALLBACK}?success=true` +
        `&accessToken=${encodeURIComponent(accessToken)}` +
        `&refreshToken=${encodeURIComponent(refreshToken)}`

      console.log("Redirecting to web app:", redirectTo)
      return res.redirect(redirectTo)
    }
  } catch (error) {
    console.error("Google callback error:", error)

    // Handle error redirects for both mobile and web
    const state = req.query.state
    let isMobile = false
    let mobileRedirectUri = null

    if (state) {
      try {
        const parsedState = JSON.parse(state)
        isMobile = parsedState.mobile
        mobileRedirectUri = parsedState.redirectUri
      } catch (e) {
        // Ignore parsing errors
      }
    }

    if (isMobile && mobileRedirectUri) {
      return res.redirect(`${mobileRedirectUri}?success=false&error=${encodeURIComponent(error.message)}`)
    } else {
      return res.redirect(`${FRONTEND_CALLBACK}?success=false`)
    }
  }
}

module.exports = { loginWithGoogle, googleCallback }
