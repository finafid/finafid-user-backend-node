const { populate } = require("../../models/auth/userSchema");
const FashionBlog = require("../../models/Finafid_Fashion/Blog");
const {
  generateStringOfImageList,
  compressAndResizeImage,
  uploadFiles,
} = require("../../utils/fileUpload");
const getMediaLink = async (file, res) => {
  try {
    const inputMediaPath = file.buffer; // Access the buffer directly
    const extension = file.originalname.split(".").pop().toLowerCase();
    const allowedImageExtensions = ["jpg", "jpeg", "png"];
    const allowedVideoExtensions = ["mp4", "mov", "avi"];

    // Determine if the file is an image or a video
    let mediaBuffer;
    if (allowedImageExtensions.includes(extension)) {
      // Process image
      const width = 800;
      const compressionQuality = 0; // Set compression quality (0 is highest compression)
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
    const timestamp = Date.now();
    const cleanFileName = file.originalname.split(".")[0].split(" ").join("-");
    const finalFileName = `${cleanFileName}-${timestamp}.${extension}`;

    // Upload the processed image or video to the server (e.g., AWS S3 or another cloud service)
    await generateStringOfImageList(mediaBuffer, finalFileName, res); // Adjust function for both images and videos

    const mediaUrl = `https://d2w5oj0jmt3sl6.cloudfront.net/${finalFileName}`; // Adjust the path as per your cloud provider

    return mediaUrl;
  } catch (error) {
    console.error("Error in getMediaLink:", error);
    res.status(500).json({ message: "File processing failed" });
    throw error; // To signal the error in the calling function
  }
};

const createBlog = async (req, res) => {
  try {
    const { caption, productList, userName, fashionCategory } = req.body;

    let logoUrls = [];
    let userLogos = [];

    const uploadedFiles = {};
    console.log(req.files);
    // Process all files and categorize by fieldname
    for (const file of req.files) {
      const fieldName = file.fieldname;
      if (!uploadedFiles[fieldName]) {
        uploadedFiles[fieldName] = [];
      }
      uploadedFiles[fieldName].push(file);
    }

    // Check for 'logoUrl[]' instead of 'logoUrl'
    if (uploadedFiles["logoUrl[]"]) {
      console.log("Uploading logoUrls...");
      for (const file of uploadedFiles["logoUrl[]"]) {
        const logoUrl = await getMediaLink(file, res);
        logoUrls.push(logoUrl);
      }
    }

    // 'userLogo' field seems fine
    if (uploadedFiles["userLogo"]) {
      console.log("Uploading userLogos...");
      for (const file of uploadedFiles["userLogo"]) {
        const userLogoUrl = await getMediaLink(file, res);
        userLogos.push(userLogoUrl);
      }
    }

    const newFashionBlog = new FashionBlog({
      caption,
      productList,
      logoUrls, // Store all logo URLs
      userName,
      fashionCategory,
      userLogo: userLogos, // Store all user logo URLs
    });

    if (!newFashionBlog) {
      return res.status(500).json({ message: "Cannot create" });
    }

    await newFashionBlog.save();
    return res.status(200).json({ message: "Successfully created" });
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
    let logoUrls = "";
    let userLogo = "";

    const uploadedFiles = {};
    console.log(req.files);
    // Process all files and categorize by fieldname
    for (const file of req.files) {
      const fieldName = file.fieldname;
      if (!uploadedFiles[fieldName]) {
        uploadedFiles[fieldName] = [];
      }
      uploadedFiles[fieldName].push(file);
    }

    // Check for 'logoUrl[]' instead of 'logoUrl'
    if (uploadedFiles["logoUrl[]"]) {
      console.log("Uploading logoUrls...");
      for (const file of uploadedFiles["logoUrl[]"]) {
        const logoUrl = await getMediaLink(file, res);
        logoUrls.push(logoUrl);
      }
    }

    // 'userLogo' field seems fine
    if (uploadedFiles["userLogo"]) {
      console.log("Uploading userLogos...");
      for (const file of uploadedFiles["userLogo"]) {
        const userLogoUrl = await getMediaLink(file, res);
        userLogo.push(userLogoUrl);
      }
    }
    if (logoUrls.length !== 0) {
      fashionCategoryDetails.logoUrls = logoUrls;
      await fashionCategoryDetails.save();
    }
    if (userLogo.length !== 0) {
      fashionCategoryDetails.userLogo = userLogo;
      await fashionCategoryDetails.save();
    }
    if (req.body) {
      const { caption, productList, userName, fashionCategory } = req.body;
      fashionCategoryDetails.caption = caption;
      fashionCategoryDetails.productList = productList;
      fashionCategoryDetails.userName = userName;
      fashionCategoryDetails.fashionCategory = fashionCategory;
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
      req.params.fashionBlogId
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
      req.params.fashionBlogId
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
};
const getAllFashionBlog = async (req, res) => {
  try {
    const fashionBlogDetails = await FashionBlog.find()
      .populate("productList")
      .populate("fashionCategory");
    if (!fashionBlogDetails) {
      return res.status(404).json({ message: "Fashion category not found" });
    }
    return res.status(200).json({ fashionCategoryDetails: fashionBlogDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
module.exports = {
  createBlog,
  editFashionBlog,
  deleteFashionBlog,
  getFashionBlogById,
  getBlogsFashionCategoryUser,
  getAllFashionBlog,
};
