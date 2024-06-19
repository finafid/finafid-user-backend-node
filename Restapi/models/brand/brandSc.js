const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    logoUrl: {
        type: String,
        required: true
    },
});

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand; 