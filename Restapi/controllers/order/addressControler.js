const Address = require("../../models/Order/address");

const addAddress = async (req, res) => {
  try {
    console.log(req.body.addressType);
   
    const newAddress = new Address({
      userId: req.user._id,
      addressType: req.body.addressType,
      receiverName: req.body.receiverName,
      receiverPhone: req.body.receiverPhone,
      locality: req.body.locality,
      city: req.body.city,
      street: req.body.street,
      houseNumber: req.body.houseNumber,
      pinCode: req.body.pinCode,
      landMark: req.body.landMark,
      state: req.body.state,
      country: req.body.country,
    });
    console.log(newAddress);
    await newAddress.save();
    res.status(200).json({
      success: true,
      message: "Address is saved successfully ",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
const getAddressOfUser = async (req, res) => {
  try {
    const addressDetails = await Address.find({
      userId: req.user._id,
    });

    if (addressDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No address is found",
      });
    }

    console.log(addressDetails);
    return res.status(200).json({
      success: true,
      addressDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
const editAddress = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
module.exports = {
  addAddress,
  getAddressOfUser,
};
