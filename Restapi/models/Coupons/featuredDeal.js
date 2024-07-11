
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FeaturedDealSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      require: false,
    },
  ],
  banner: {
    type: String,
    required: true,
  },

  start_Date: {
    type: Date,
    required: true,
  },
  end_Date: {
    type: Date,
    required: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
});
const FeaturedDeal = mongoose.model("FeaturedDeal", FeaturedDealSchema);

module.exports = FeaturedDeal;
