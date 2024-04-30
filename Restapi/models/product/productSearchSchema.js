const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const productSearchSchema=new mongoose.Schema({
    subCategoryId:{
        type:Schema.Types.ObjectId,
        ref:'subCategory',
        require:true,
    },searchResult:{
        type: Schema.Types.Mixed
    }
})
const productSearch=mongoose.model('productSearch', productSearchSchema);