const FashionCategory = require("../../models/Finafid_Fashion/fashionCategory");
const {
  generateStringOfImageList,
  compressAndResizeImage,
} = require("../../utils/fileUpload");
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
const createFashionCategory = async (req, res) => {
  try {
     console.log("nkjwkdjqo");
    const { name, description } = req.body;
    let logoUrl = "";
    console.log(req.file)
    if (req.file) {
      logoUrl = await getImageLink(req);
    }
    const newFashionCategory = new FashionCategory({
      name,
      description,
      logoUrl,
    });
    if (!newFashionCategory) {
      return res.status(500).json({ message: "Cannot create" });
    }
    await newFashionCategory.save();
    return res.status(200).json({ message: " Successfully created" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const editFashionCategory = async (req, res) => {
  try {
    const fashionCategoryDetails = await FashionCategory.findById(
      req.params.fashionCategoryId
    );
    let newLogoUrl = "";
    if (req.file) {
      newLogoUrl = await getImageLink(req);
      fashionCategoryDetails.logoUrl = newLogoUrl;
      await fashionCategoryDetails.save();
    }
    if (req.body) {
      const { name, description } = req.body;
      fashionCategoryDetails.name = name;
      fashionCategoryDetails.description = description;
      await fashionCategoryDetails.save();
    }
    return res.status(200).json({ message: " Successfully edited" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const deleteFashionCategory = async (req, res) => {
  try {
    const fashionCategoryDetails = await FashionCategory.findByIdAndDelete(
      req.params.fashionCategoryId
    );

    if (!fashionCategoryDetails) {
      return res.status(404).json({ message: "Fashion category not found" });
    }

    return res.status(200).json({
      message: "Fashion category deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const getFashionCategoryById = async (req, res) => {
  try {
    const fashionCategoryDetails = await FashionCategory.findById(
      req.params.fashionCategoryId
    );
    if (!fashionCategoryDetails) {
      return res.status(404).json({ message: "Fashion category not found" });
    }
    return res
      .status(200)
      .json({ fashionCategoryDetails: fashionCategoryDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getBlogsFashionCategoryById = async (req, res) => {
  try {
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getAllFashionCategory=async(req,res)=>{
  try {
    const fashionCategoryList = await FashionCategory.find();
    if (!fashionCategoryList) {
      return res.status(404).json({ message: "Fashion category not found" });
    }
    return res.status(200).json({ fashionCategoryList: fashionCategoryList });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
}
module.exports = {
  createFashionCategory,
  editFashionCategory,
  deleteFashionCategory,
  getFashionCategoryById,
  getBlogsFashionCategoryById,
  getAllFashionCategory,
};
