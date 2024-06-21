const Joi = require('joi'); // Corrected import statement
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blackListSchema = new Schema({
    token: {
        type: String, // Corrected type definition
        required: true
    }
}, { timestamps: true });

const blackListModel = mongoose.model('BlackList', blackListSchema); // Corrected model name
module.exports = blackListModel;
