const mongoose=require('mongoose');
const User=require('../../models/auth/userSchema')
const giftCardSchema=new mongoose.Schema({

    Code:{
        type:String,
        required:true
    } ,

    Value:{
        type:Number,
        required:true
    } , 
    Expiration_Date:{
        type:Date,
        required:true
    },
    Status:{
        type:String,
        required:true,
        enum: ['active', 'redeemed', 'expired'],
        default:'active'
    },
    Recipient_Information:{
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        phoneNumber:{
            type:Number,
            required:true
        }
    },
    Issuer_Information:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' ,
        require:true,
    },
    Activation_Date:{
        type:String,
        required:true
    },
    Additional_Metadata:{
        type:String,
        required:true
    }
},{ timestamps: true })
module.exports=mongoose.model('GiftCard',giftCardSchema)