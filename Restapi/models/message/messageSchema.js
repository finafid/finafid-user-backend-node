const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
    },
    template: {
      type: String,
    },
    unique_string: {
      type: String,
    },
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
