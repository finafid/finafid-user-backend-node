const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainCategorySchema = new Schema({
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
},{ timestamps: true });

const MainCategory = mongoose.model('MainCategory', mainCategorySchema);

module.exports = MainCategory; // Export the Product model
