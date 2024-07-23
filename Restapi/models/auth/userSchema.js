const { boolean } = require('joi');
const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const UserSchema = new Schema({
  fullName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
  },
  imgUrl: {
    type: String,
  },
  phone: {
    type: Number,
    required: true,
    unique: true,
  },
  email_validation: {
    type: Boolean,
    required: false,
    default: false,
  },
  status: {
    type: String,
    enum: ["Active", "Not Active"],
    default: "Active",
  },
  push_notification: {
    type: Boolean,
    default: true,
    required: false,
  },
  fcmToken: {
    type: String,
  },
  is_utsav: {
    type: Boolean,
    required: false,
    default: false,
  },
  firstOrderComplete: {
    type: Boolean,
    required: false,
    default: false,
  },
});
const userModel=mongoose.model('user',UserSchema)
module.exports=userModel;