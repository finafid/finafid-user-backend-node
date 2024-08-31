const mongoose = require("mongoose");
const leaderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    admin_approval: {
      type: String,
      required: false,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    status: {
      type: Boolean,
      required:false,
      default:false,
    },
  },
  { timestamps: true }
);
const Leader = mongoose.model("Leader", leaderSchema);

module.exports = Leader;
