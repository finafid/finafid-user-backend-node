const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    title: { type: String },
    body: { type: String },
    read: { type: Boolean },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
