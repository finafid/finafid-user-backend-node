const GiftCard = require("../../models/GiftCard/giftCard");
const User = require("../../models/auth/userSchema");
const Wallet = require("../../models/Wallet/wallet");
const GiftCardTemplate = require("../../models/GiftCard/giftCardTemplate");
const {
  generateStringOfImageList,
  compressAndResizeImage,
} = require("../../utils/fileUpload");
const getImageLink = async (req, res) => {
  try {
    const inputImagePath = await req.file.buffer;

    const extension = req.file.originalname.split(".").pop();

    const width = 800;
    const compressionQuality = 5;

    const imageBuffer = await compressAndResizeImage(
      inputImagePath,
      extension,
      width,
      compressionQuality
    );

    req.file.originalname =
      req.file.originalname.split(".")[0].split(" ").join("-") +
      "-" +
      Date.now() +
      "." +
      extension;

    await generateStringOfImageList(imageBuffer, req.file.originalname, res);

    const imgUrl =
      "https://d2w5oj0jmt3sl6.cloudfront.net/" + req.file.originalname;

    return imgUrl;
  } catch (error) {
    console.error("Error in getImageLink:", error);
  }
};
const createGiftCard = async (req, res) => {
  try {
    const customerId = await User.findOne({ _id: req.user._id });

    const {
      value,
      Recipient_Information: { name, email, phoneNumber },
      templateId,
      message,
    } = req.body;

    const code = req.user._id.toString() + "giftNo" + Date.now();
    const Activation_Date = new Date();
    const Expiration_Date = new Date(Activation_Date);
    Expiration_Date.setDate(Expiration_Date.getDate() + 90);
    const walletDetails = await Wallet.findOne({
      userId: req.user._id,
    });
    if (walletDetails.balance < value) {
      return res.status(400).json({ message: "Not enough amount in Wallet" });
    }
    walletDetails.balance = (walletDetails.balance - value);
    await walletDetails.save();
    const newGiftCard = new GiftCard({
      Code: code,
      Value: value,
      Expiration_Date: Expiration_Date,
      Recipient_Information: {
        name: name,
        email: email,
        phoneNumber: phoneNumber,
      },
      Issuer_Information: customerId,
      Activation_Date: Activation_Date,
      Additional_Metadata: null,
      templateId,
      message,
    });
    await newGiftCard.save();
    return res
      .status(200)
      .json({ message: "Successfully created giftCard", newGiftCard });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getGiftCardDetails = async (req, res) => {
  try {
    const giftCardDetails = await GiftCard.findOne({
      _id: req.params.giftCardId,
    })
      .populate("templateId")
      .populate("Issuer_Information");
    if (!giftCardDetails) {
      return res.status(400).json({
        success: false,
        message: "No gift card Present",
      });
    }
    return res.status(200).json(giftCardDetails);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getGiftCardByUser = async (req, res) => {
  try {
    const currentDate=Date.now()
    const userDetails = await GiftCard.find({
      Issuer_Information: req.user._id,
      Expiration_Date: { $gt: currentDate },
    })
      .populate("templateId")
      .populate("Issuer_Information");
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "No gift card Present",
      });
    }
    return res.status(200).json(userDetails);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const redeemGiftCard = async (req, res) => {
  try {
    const giftCardDetails = await GiftCard.findOne({
      code: req.body.code,
      Status: "active",
      // "recipientInformation.email": req.user.email,
    });
    if (!giftCardDetails) {
      return res.status(500).json({
        success: false,
        message: " Invalid GiftCard",
      });
    }
    const walletDetails = await Wallet.findOne({
      userId: req.user._id,
    });
    walletDetails.balance = walletDetails.balance + giftCardDetails.Value;
    await walletDetails.save();
    return res.status(200).json({
      success: true,
      message: "GiftCard redeemed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const createGiftCardTemplate = async (req, res) => {
  try {
    const { title } = req.body;
    const template = await getImageLink(req);
    const newGiftCardTemplate = new GiftCardTemplate({
      title,
      template,
    });
    if (!newGiftCardTemplate) {
      res.status(500).json({
        success: false,
        message: " No such GiftCard",
      });
    }
    await newGiftCardTemplate.save();
    return res.status(200).json({
      success: true,
      message: "Created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getAllTemplates = async (req, res) => {
  try {
    const allTemplates = await GiftCardTemplate.find();
    if (!allTemplates){
       return res.status(500).json({
         success: false,
         message:"No template available",
       });
    }
      return res.status(200).json({
        success: true,
        allTemplates,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const deleteTemplate = async (req, res) => {
  try {
    const allTemplates = await GiftCardTemplate.findByIdAndDelete(
      req.params.templateId
    );
    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const editTemplateId = async (req, res) => {
  try {
    const templatesDetails = await GiftCardTemplate.findById(
      req.params.templateId
    );
    console.log(req.body);
    if (!templatesDetails) {
      return res.status(500).json({
        success: false,
        message: "no template",
      });
    }
    if (req.file) {
      const template = await getImageLink(req);
      templatesDetails.template = template;
      await templatesDetails.save();
    }
    if (req.body) {
      templatesDetails.title = req.body.title;
      await templatesDetails.save();
    }
    return res.status(200).json({
      success: true,
      message: "Edited successfully successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getTemplateId = async (req, res) => {
  try {
    const templatesDetails = await GiftCardTemplate.findById(
      req.params.templateId
    );
    if (!templatesDetails) {
      return res.status(500).json({
        success: false,
        message: "no template",
      });
    }
    return res.status(200).json({
      success: true,
      templatesDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getAllGiftCard = async (req, res) => {
  try {
    const newGiftCardTemplate = await GiftCard.find()
      .populate("Issuer_Information")
      .populate("templateId")
  
    if (!newGiftCardTemplate) {
      res.status(500).json({
        success: false,
        message: " No such GiftCard",
      });
    }

    return res.status(200).json({
      success: true,
      newGiftCardTemplate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const sendGiftCard=async(req,res)=>{
  try {
      const giftCardDetails = await GiftCard.findOne({
        _id: req.params.giftCardId,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
}

module.exports = {
  createGiftCard,
  getGiftCardDetails,
  getGiftCardByUser,
  redeemGiftCard,
  createGiftCardTemplate,
  getAllTemplates,
  deleteTemplate,
  editTemplateId,
  getTemplateId,
  getAllGiftCard,
  sendGiftCard,
};
