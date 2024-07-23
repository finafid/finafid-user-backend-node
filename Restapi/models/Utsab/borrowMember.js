const mongoose = require("mongoose");
const borrowMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leader",
    },
    due_amount:{
        type:Number,
        required:true
    },
    admin_approval:{
      type:Boolean,
      required:false,
      default:false
    }
  },
  { timestamps: true }
);
const BorrowMember = mongoose.model("BorrowMember", borrowMemberSchema);

module.exports = BorrowMember;
