const User = require("../models/auth/userSchema");
const Notification = require("../models/Notification/pushNotification");
const admin = require("firebase-admin");


admin.initializeApp({
  credential: admin.credential.cert({
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.CERT_URL,
    "universe_domain": "googleapis.com"
  })
});

async function sendNotification(userId, title, body) {
  try {
    const user = await User.findById(userId);

    if (!user || !user.fcmToken || user.fcmToken.length === 0) {
      console.error("No FCM tokens found for user");
      return;
    }

    // Convert old string token to an array if necessary
    if (typeof user.fcmToken === "string") {
      user.fcmToken = [user.fcmToken]; 
    } else if (!Array.isArray(user.fcmToken)) {
      user.fcmToken = [];
    }

    // Remove invalid or empty tokens
    user.fcmToken = user.fcmToken.filter(token => typeof token === "string" && token.trim() !== "");

    if (user.fcmToken.length === 0) {
      console.error("No valid FCM tokens found for user");
      return;
    }

    console.log("FCM Tokens:", user.fcmToken);

    // Store notification in MongoDB
    const notification = new Notification({
      userId: userId,
      title: title,
      body: body,
      timestamp: new Date(),
      read: false,
    });
    await notification.save();
    console.log("Notification stored in MongoDB");

    // Notification payload
    const messagePayload = {
      notification: {
        title: title,
        body: body,
      },
    };

    // Send notification to all valid tokens
    const responses = await Promise.all(
      user.fcmToken.map(async (token) => {
        try {
          return await admin.messaging().send({ ...messagePayload, token });
        } catch (error) {
          console.error(`Error sending to token ${token}:`, error);
          return null; // Avoids breaking the loop
        }
      })
    );

    console.log("FCM Response:", responses.filter((res) => res !== null));
  } catch (error) {
    console.error("Error in sendNotification:", error);
  }
}



module.exports = {
  sendNotification,
};
