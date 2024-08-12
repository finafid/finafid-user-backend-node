const User = require("../models/auth/userSchema");
const Notification = require("../models/Notification/pushNotification");
const admin = require("firebase-admin");
const serviceAccount = require("../../finafid-a37bc-firebase-adminsdk-9icoq-22543df655.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function sendNotification(userId, title, body) {
  const user = await User.findById(userId);
  console.log(user);
  if (user && user.fcmToken) {
    const messagePayload = {
      notification: {
        title: title,
        body: body,
      },
      token: user.fcmToken, // Specify the token here
    };

    const notification = new Notification({
      userId: userId,
      title: title,
      body: body,
      timestamp: new Date(),
      read: false,
    });
    await notification.save();
    console.log("Notification stored in MongoDB");
    const response = await admin.messaging().send(messagePayload);
    console.log("Successfully sent message:", response);
  } else {
    console.error("No FCM tokens found for user");
  }
}

module.exports = {
  sendNotification,
};
