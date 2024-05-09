const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product = require("../../models/product/productSc");
const User=require("../../models/auth/userSchema")

const cartSchema = new Schema({
    Products: {
        type: Schema.Types.ObjectId,
        ref: 'Product', 
        required: true,
    },
    UserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    count: {
        type: Number,
        required: true
    }
},{ timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 
