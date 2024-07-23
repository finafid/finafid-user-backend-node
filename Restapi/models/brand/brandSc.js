const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
    required: true,
  },
  is_featured: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand; 