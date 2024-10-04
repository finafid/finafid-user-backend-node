const FashionBlog = require("../../models/Finafid_Fashion/Blog");
const {
  generateStringOfImageList,
  compressAndResizeImage,
} = require("../../utils/fileUpload");
const getMediaLink = async (req, res) => {
  try {
    const inputMediaPath = await req.file.buffer;
    const extension = req.file.originalname.split(".").pop().toLowerCase();
    const allowedImageExtensions = ["jpg", "jpeg", "png"];
    const allowedVideoExtensions = ["mp4", "mov", "avi"];

    // Determine if the file is an image or a video
    let mediaBuffer;
    if (allowedImageExtensions.includes(extension)) {
      // Process image
      const width = 800;
      const compressionQuality = 0;
      mediaBuffer = await compressAndResizeImage(
        inputMediaPath,
        extension,
        width,
        compressionQuality
      );
    } else if (allowedVideoExtensions.includes(extension)) {
      // Handle video upload (no compression here, just use the buffer directly)
      mediaBuffer = inputMediaPath; // Use the file buffer directly for video
    } else {
      throw new Error("Unsupported file type");
    }

    // Generate a new file name
    req.file.originalname =
      req.file.originalname.split(".")[0].split(" ").join("-") +
      "-" +
      Date.now() +
      "." +
      extension;

    // Assuming you have a similar method for video upload or use the same for both
    await generateStringOfImageList(mediaBuffer, req.file.originalname, res);

    const mediaUrl =
      "https://d2w5oj0jmt3sl6.cloudfront.net/" + req.file.originalname;

    return mediaUrl;
  } catch (error) {
    console.error("Error in getMediaLink:", error);
  }
};

const createBlog = async (req, res) => {
  try {
    const { name, description, userName, fashionCategory } = req.body;
    let logoUrl = "";
    if (uploadedFiles[blogMedia]) {
      logoUrl = await getMediaLink(req);
    }
    let userLogo=""
    if (uploadedFiles[userImage]) {
      const [imageLink] = await getMediaLink(uploadedFiles[colorImageKey]);
      userLogo = imageLink;
    }
    const newFashionBlog = new FashionBlog({
      name,
      description,
      logoUrl,
      userName,
      fashionCategory,
      userLogo,
    });
    if (!newFashionBlog) {
      return res.status(500).json({ message: "Cannot create" });
    }
    await newFashionBlog.save();
    return res.status(200).json({ message: " Successfully created" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const editFashionBlog = async (req, res) => {
  try {
    const fashionCategoryDetails = await FashionBlog.findById(
      req.params.fashionBlogId
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
const deleteFashionBlog = async (req, res) => {
  try {
    const fashionCategoryDetails = await FashionBlog.findByIdAndDelete(
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

const getFashionBlogById = async (req, res) => {
  try {
    const fashionCategoryDetails = await FashionBlog.findById(
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
const getBlogsFashionCategoryUser = async (req, res) => {
  try {
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};const getAllFashionBlog=async(req,res)=>{
  try {
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
}
module.exports = {
  createBlog,
  editFashionBlog,
  deleteFashionBlog,
  getFashionBlogById,
  getBlogsFashionCategoryUser,
  getAllFashionBlog,

};
