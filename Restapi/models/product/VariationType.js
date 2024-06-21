const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const variationTypeSc = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const variationType = mongoose.model("variationType", variationTypeSc);

module.exports = variationType;
