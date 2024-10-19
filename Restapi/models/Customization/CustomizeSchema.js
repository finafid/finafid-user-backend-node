const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const custoMizationSchema = new Schema({
  colorName: {
    type: "String",
  },
  colorImage: {
    type: "String",
  },
  frontImage: {
    type: "String",
  },
  backImage: {
    type: "String",
  },
  tShirtType:{
    enum:["Men","Women","Oversized"]
  }
});

const CustoMization = mongoose.model("CustoMization", custoMizationSchema);

module.exports = CustoMization;
