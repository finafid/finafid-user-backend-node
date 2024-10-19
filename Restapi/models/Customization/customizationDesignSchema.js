const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const custoMizeDesignSchema = new Schema({
  title: {
    type: "String",
  },
  DesignLink: {
    type: "String",
  },
});

const CustoMizeDesign = mongoose.model(
  "CustoMizeDesign",
  custoMizeDesignSchema
);

module.exports = CustoMizeDesign;
