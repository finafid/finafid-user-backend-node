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

async function sendNotification(userId, title, body, imageurl, url) {
  console.log(imageurl, url);
  try {
    const user = await User.findById(userId);

    if (!user || (!user.fcmTokens && !user.fcmToken)) {
      console.error("No FCM tokens found for user");
      return;
    }

    const notificationPayload = {
      notification: {
        title,
        body,
      },
      android: {
        notification: {
          imageUrl: imageurl,
        },
      },
      data: {
        link: url,
        action_1: "VIEW_ORDER",
        action_1_text: "View Order",
        action_2: "CANCEL_ORDER",
        action_2_text: "Cancel Order",
      },
    };

    const fcmToken = user.fcmToken && user.fcmToken.trim();

    // Step 1: Send to user.fcmToken if it's valid
    if (fcmToken) {
      try {
        const singleTokenResponse = await admin.messaging().send({
          ...notificationPayload,
          token: fcmToken,
        });
        console.log(`Notification sent to user.fcmToken: ${fcmToken}`);
      } catch (error) {
        console.error(`Failed to send to user.fcmToken: ${fcmToken}`, error);
      }
    }

    // Step 2: Send to all fcmTokens[] except fcmToken
    const allOtherTokens = (user.fcmTokens || []).filter(
      (token) =>
        typeof token === "string" &&
        token.trim() !== "" &&
        token.trim() !== fcmToken 
    );

    if (allOtherTokens.length === 0) {
      console.log("No additional tokens to send after user.fcmToken");
      return;
    }

    const notificationPromises = allOtherTokens.map(async (token) => {
      try {
        const response = await admin.messaging().send({
          ...notificationPayload,
          token,
        });
        console.log(`Notification sent to token: ${token}`);
        return response;
      } catch (error) {
        console.error(`Failed to send notification to token: ${token}`, error);
      }
    });

    const responses = await Promise.all(notificationPromises);
    console.log("Notifications sent to remaining tokens:", responses);

  } catch (error) {
    console.error("Error in sendNotification:", error);
  }
}



module.exports = { sendNotification };
