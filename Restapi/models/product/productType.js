const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const subCategory=require("../product/SubCategory")

const productTypeSchema = new Schema({
    name: {
        type: String,
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
    subCategory:{
        type:Schema.Types.ObjectId,
        ref:'subCategory',
        require:true,
    }
},{ timestamps: true });

const ProductType = mongoose.model('ProductType', productTypeSchema);

module.exports = ProductType; 
