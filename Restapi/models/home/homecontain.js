const mongoose = require('mongoose');

const HomePageComponentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, 
    position: { type: Number, default: 0 },
    style: { type: mongoose.Schema.Types.Mixed, default: {} }, 
    details: {
      text: { type: String, default: "" },
      link: { type: String, default: "" },
    },
    api: {
     bannerType: { type: String, default: "" },
     position: { type: String, default: "" },
     resourceType: { type: String, default: "" },
     valueId: { type: String, default: "" },
   },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true } 
);

module.exports = mongoose.model('HomePageComponent', HomePageComponentSchema);
