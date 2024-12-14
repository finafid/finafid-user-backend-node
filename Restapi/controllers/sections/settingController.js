const Setting = require('../../models/sections/Setting');

// Create a new setting group
const createSetting = async (req, res) => {
  try {
    const settingData = req.body;
    const setting = new Setting(settingData);
    await setting.save();
    res.status(201).json(setting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all settings groups
const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    res.status(200).json({error:false,data:settings});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get a specific setting by ID
const getSettingById = async (req, res) => {
  try {
    const setting = await Setting.findById(req.params.id);
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.status(200).json(setting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a specific setting group
const updateSetting = async (req, res) => {
  try {
    const setting = await Setting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.status(200).json(setting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a setting group
const deleteSetting = async (req, res) => {
  try {
    const setting = await Setting.findByIdAndDelete(req.params.id);
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.status(200).json({ message: 'Setting deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
module.exports = {
  getSettings,
  getSettingById,
  createSetting,
  updateSetting,
  deleteSetting,
};