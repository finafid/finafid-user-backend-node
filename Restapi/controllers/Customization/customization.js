const customization = require("../../models/Customization/CustomizeSchema");
const customizationDesign = require("../../models/Customization/customizationDesignSchema");
const {
  generateStringOfImageList,
  compressAndResizeImage,
} = require("../../utils/fileUpload");
const Product = require("../../models/product/productSc");
const getImageLink = async (req, res) => {
  try {
    const inputImagePath = await req.file.buffer;
    const extension = req.file.originalname.split(".").pop();
    const width = 800;
    const compressionQuality = 0;

    const imageBuffer = await compressAndResizeImage(
      inputImagePath,
      extension,
      width,
      compressionQuality
    );

    // Generate a new file name
    req.file.originalname =
      req.file.originalname.split(".")[0].split(" ").join("-") +
      "-" +
      Date.now() +
      "." +
      extension;

    // Assuming generateStringOfImageList is a function that uploads the image and generates a link
    await generateStringOfImageList(imageBuffer, req.file.originalname, res);

    // Generate the image URL
    const imgUrl =
      "https://d2w5oj0jmt3sl6.cloudfront.net/" + req.file.originalname;

    return imgUrl;
  } catch (error) {
    console.error("Error in getImageLink:", error);
  }
};
const createCustomizationModel = async (req, res) => {
  try {
    const { color, tShirtType } = req.body;
    req.files
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const createCustomizationDesign = async (req, res) => {
  try {

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
module.exports = {
  createCustomizationModel,
  createCustomizationDesign,
};