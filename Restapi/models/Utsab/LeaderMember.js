const mongoose = require("mongoose");
const leaderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    borrowMemberLIst: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    status:{
        type:Boolean,
        required:false,
        default:true
    }
  },
  { timestamps: true }
);
const Leader = mongoose.model("Leader", leaderSchema);

module.exports = Leader;
