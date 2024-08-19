const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const productSearchSchema = new mongoose.Schema({
  entityId: {
    type: String,
  },
  entityName: {
    type: String,
  },
  modelName: {
    type: String,
  },
});
const productSearch=mongoose.model('productSearch', productSearchSchema);
module.exports = {
  productSearch,
};