const mongoose = require('mongoose');


const SettingSchema = new mongoose.Schema({
  name: { type: String, required: true },  // Main group name (e.g., 'Main', 'My Account')
  type: { type: String, enum: ['tabs', 'list'], default: 'list' },  // Type of display (tabs or list)
  settings: [
    {
      id: { type: Number, required: true },
      title: { type: String, required: true },
      lib: { type: String, required: true },
      icon: { type: String, required: true },
      action: { type: String, required: true },
      click: { type: String, required: true },
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("setting", SettingSchema);
