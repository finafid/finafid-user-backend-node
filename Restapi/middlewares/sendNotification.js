const User = require("../models/auth/userSchema");
const Notification = require("../models/Notification/pushNotification");
const admin = require("firebase-admin");

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.CERT_URL,
      universe_domain: "googleapis.com"
    })
  });
}

async function sendNotification(userId, title, body,imageurl,url) {
  console.log(imageurl,url)
  try {
    const user = await User.findById(userId);

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.error("No FCM tokens found for user");
      return;
    }

    // Filter valid tokens
    const validTokens = user.fcmTokens.filter(token => typeof token === "string" && token.trim() !== "");

    if (validTokens.length === 0) {
      console.error("No valid FCM tokens found for user");
      return;
    }

    console.log("Sending notification to FCM Tokens:", validTokens);

    // Send individual notifications to all valid tokens
    const notificationPromises = validTokens.map(async (token) => {
      const messagePayload = {
        notification: {
          title: title,
          body: body,
        },
        token: token,
        android: {
          notification: {
            imageUrl: imageurl, // You can also set the image URL for Android notifications here
          },
        },
        data: {
          link: url, 
          action_1: "VIEW_ORDER",
           action_1_text: "View Order",
          action_2: "CANCEL_ORDER",
          action_2_text: "Cancel Order"
        },
      };

      try {
        const response = await admin.messaging().send(messagePayload);
        console.log(`Notification sent successfully to token: ${token}`);
        return response;
      } catch (error) {
        console.error(`Failed to send notification to token: ${token}`, error);
      }
    });

    const responses = await Promise.all(notificationPromises);
    console.log("Notifications sent successfully:", responses);

  } catch (error) {
    console.error("Error in sendNotification:", error);
  }
}


module.exports = { sendNotification };
