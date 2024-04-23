const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const productType=require('../product/productType')

const productSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    
    productType: {
        type: Schema.Types.ObjectId,
        ref: 'productType' ,
        require:true,
    },
    brand:{
        type:Schema.Types.ObjectId,
        ref:'Brand',
        required:true
    },
    quantity: {
        type: Number,
        required: true
    },
    item_code:{
        type:String,
        required:true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
    details: {
        type: Schema.Types.Mixed
    },
    attributes: {
        color: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        strength: {
            type: Number,
            required: true
        },
    },
    isCustomizable:{
        type:Boolean,
        default:false
        
    }
},{ timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 
