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
      isDefault: false,
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
const updateAddressOfUser = async (req, res) => {
  try {
    // Extract the address id from request parameters or body, depending on your route structure
    const { addressId } = req.body;

    // Find the address by its id and the user id to ensure the address belongs to the user
    const addressDetails = await Address.findOne({
      _id: addressId,
      userId: req.user._id,
    });

    if (!addressDetails) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Update the address fields with data from request body
    const updatedFields = req.body;
    for (let key in updatedFields) {
      if (updatedFields.hasOwnProperty(key)) {
        addressDetails[key] = updatedFields[key];
      }
    }

    // Save the updated address
    await addressDetails.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      addressDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    const addressDetails = await Address.findByIdAndDelete({
      _id: addressId,
    });
    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
const setDefaultAddress=async(req,res)=>{
  try {
    const {addressId}=req.body;
    const allAddress=await Address.find({
      userId:req.user._id
    })
    for (let address of allAddress) {
      address.isDefault = false;
      await address.save();
    }
    const defaultAddress = await Address.findById({
      _id: addressId,
    });
    defaultAddress.isDefault=true;
    await defaultAddress.save()
    return res.status(200).json({
      success: true,
      message: "Set as Default",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }

}
module.exports = {
  addAddress,
  getAddressOfUser,
  updateAddressOfUser,
  deleteAddress,
  setDefaultAddress,
};
