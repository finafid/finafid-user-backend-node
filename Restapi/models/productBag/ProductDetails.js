const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productDetailsSchema = new Schema({
    ProductId: {
        type: Schema.Types.ObjectId,
        ref: 'Product', 
        required: true,
    },
    itemQuantity:{
        type:Number
    }
},{ timestamps: true });

const ProductDetails = mongoose.model('ProductDetails', productDetailsSchema);

module.exports = ProductDetails; 