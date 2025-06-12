const { google } = require("googleapis")
const User = require("../../models/auth/userSchema")
const { OAuth2Client } = require("google-auth-library")
const jwt = require("jsonwebtoken")

// read from process.env
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL
const FRONTEND_CALLBACK = process.env.FRONTEND_CALLBACK_URL
const MOBILE_CALLBACK = process.env.MOBILE_CALLBACK_URL
const GOOGLE_ANDROID_CLIENT_ID = process.env.google_android_clientId
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

const googleNativeAuth = async (req, res) => {
  try {
    const { idToken, serverAuthCode, user } = req.body

    console.log("Received Google native auth request:", {
      hasIdToken: !!idToken,
      hasServerAuthCode: !!serverAuthCode,
      user: user ? { email: user.email, name: user.name } : null,
    })

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "ID token is required",
      })
    }

    // Support multiple client IDs for verification
    const audiences = [GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID].filter(Boolean)

    console.log(
      "Verifying ID token with audiences:",
      audiences.map((id) => id?.substring(0, 20) + "..."),
    )

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: audiences,
    })

    const payload = ticket.getPayload()
    console.log("Verified Google user:", {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      emailVerified: payload.email_verified,
      audience: payload.aud,
    })

    // Find or create user
    const appUser = await findOrCreateUser(payload, user)

    // Generate your app's JWT tokens
    const tokenPayload = {
      _id: appUser._id,
      fullname: appUser.fullName,
      email: appUser.email,
    }
    const { accessToken, refreshToken } = generateTokens(tokenPayload)

    console.log("Authentication successful for user:", appUser._id)

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: appUser._id,
        fullName: appUser.fullName,
        email: appUser.email,
        imgUrl: appUser.imgUrl,
        emailVerified: appUser.email_validation,
      },
    })
  } catch (error) {
    console.error("Google native auth error:", error)
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    })
  }
}


const googleServerCodeAuth = async (req, res) => {
  try {
    const { serverAuthCode, user } = req.body

    console.log("Received Google server code auth request:", {
      hasServerAuthCode: !!serverAuthCode,
      user: user ? { email: user.email, name: user.name } : null,
    })

    if (!serverAuthCode) {
      return res.status(400).json({
        success: false,
        message: "Server auth code is required",
      })
    }

    console.log("Exchanging server auth code for tokens...")

    // Exchange the server auth code for tokens
    const { tokens } = await oauth2Client.getToken(serverAuthCode)
    console.log("Received tokens from Google:", {
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      hasRefreshToken: !!tokens.refresh_token,
    })

    if (!tokens.id_token) {
      return res.status(400).json({
        success: false,
        message: "No ID token received from Google token exchange",
      })
    }

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: [GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID].filter(Boolean),
    })

    const payload = ticket.getPayload()
    console.log("Verified Google user from server code:", {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      emailVerified: payload.email_verified,
    })

    // Find or create user
    const appUser = await findOrCreateUser(payload, user)

    // Generate your app's JWT tokens
    const tokenPayload = {
      _id: appUser._id,
      fullname: appUser.fullName,
      email: appUser.email,
    }
    const { accessToken, refreshToken } = generateTokens(tokenPayload)

    console.log("Server code authentication successful for user:", appUser._id)

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: appUser._id,
        fullName: appUser.fullName,
        email: appUser.email,
        imgUrl: appUser.imgUrl,
        emailVerified: appUser.email_validation,
      },
    })
  } catch (error) {
    console.error("Google server code auth error:", error)
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    })
  }
}

// Helper function to find or create user
async function findOrCreateUser(googlePayload, userInfo) {
  let existingUser = await User.findOne({ email: googlePayload.email, is_Active: true })

  if (!existingUser) {
    existingUser = new User({
      fullName: googlePayload.name || userInfo?.name || "Google User",
      email: googlePayload.email,
      googleId: googlePayload.sub,
      email_validation: googlePayload.email_verified || false,
      phone: 90909090,
      password: "Google123",
      imgUrl:
        googlePayload.picture ||
        userInfo?.photo ||
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(googlePayload.name || "User")}`,
      is_Active: true,
    })

    await existingUser.save()
    console.log("Created new user:", existingUser._id)
  } else if (!existingUser.googleId) {
    existingUser.googleId = googlePayload.sub
    if (googlePayload.picture && !existingUser.imgUrl) {
      existingUser.imgUrl = googlePayload.picture
    }
    await existingUser.save()
    console.log("Updated existing user with Google ID")
  }

  return existingUser
}

module.exports = {
  loginWithGoogle,
  googleCallback,
  googleNativeAuth, googleServerCodeAuth, // Export the new function
}
