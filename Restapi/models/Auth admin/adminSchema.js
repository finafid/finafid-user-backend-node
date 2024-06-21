const { boolean } = require('joi');
const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const adminSchema=new Schema({
    fullName:{type:String,
        required:true
    },
    email:{ 
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    gender:{
        type:String
    },
    imgUrl:{
        type:String 
       },
    phone:{
        type:Number,
        required:true,
        unique:true
    },
    email_validation: {
        type: Boolean,
        required: false,
        default:false
    } ,
    status:{
        type:String ,
        enum:["Active","Not Active"],
        default:"Active"
    }  

});
const adminModel = mongoose.model("Admin", adminSchema);
module.exports = adminModel;