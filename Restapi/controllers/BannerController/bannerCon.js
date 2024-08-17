const Banner = require("../../models/Bannner/Banner");
const {
  generateStringOfImageList,
  compressAndResizeImage,
} = require("../../utils/fileUpload");

const getImageLink = async (req, res) => {
  try {
    // Extracting file buffer and extension from the request
    const inputImagePath = await req.file.buffer;

    const extension = req.file.originalname.split(".").pop();

    // Define resizing and compression parameters
    const width = 800;
    const compressionQuality = 0;

    // Compress and resize the image
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
const createBanner = async (req, res) => {
  try {
    let bannerImg = "";
    if (req.file) {
      bannerImg = await getImageLink(req);
    }

    const {
      bannerType,
      position,
      linkUrl,
      resourceType,
      valueId,
      description,
      bannerTitle,
    } = req.body;

    if (!bannerImg) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    // Construct the details object, only including valueId if it exists
    const details = {
      resourceType,
    };
    if (valueId) {
      details.valueId = valueId;
    }

    const newBanner = new Banner({
      position,
      bannerType,
      details,
      linkUrl,
      bannerImg,
      description,
      bannerTitle,
    });

    await newBanner.save();

    return res.status(200).json({
      success: true,
      message: "Banner created successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

const editBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const bannerDetails = await Banner.findOne({ _id: bannerId });
    if (!bannerDetails) {
      return res.status(500).json({
        success: false,
        message: "No banner found",
      });
    }
    let newImgLinks = [];
    if (req.file) {
      newImgLinks = await getImageLink(req);
      bannerDetails.bannerImg = newImgLinks;
      await bannerDetails.save();
    }

    if (req.body) {
      bannerDetails.bannerType=req.body.bannerType
      bannerDetails.position = req.body.position;
      bannerDetails.details.resourceType = req.body.resourceType;
      bannerDetails.details.valueId = req.body.valueId;
      bannerDetails.linkUrl = req.body.linkUrl;
      bannerDetails.description = req.body.description;
      bannerDetails.bannerTitle = req.body.bannerTitle;
      await bannerDetails.save();
    }

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
const getBannersByBannerTypeAndDetails = async (req, res) => {
  try {
    const { position, resourceType, bannerType, valueId } = req.query;
    console.log(req.query);

    const queryResult = {
      position,
      bannerType,
      is_published: true,
      "details.resourceType": resourceType,
    };

    // Add valueId to the query if it exists in the request body
    if (valueId) {
      queryResult["details.valueId"] = valueId;
    }

    // Query the database
    const banners = await Banner.find(queryResult);

    // Check if any banners were found
    if (!banners || banners.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No banners found",
      });
    }

    // Return the found banners
    return res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const bannerDetails = await Banner.findByIdAndDelete(req.params.bannerId);
    if (!bannerDetails) {
      return res.status(500).json({
        success: false,
        message: "No banner found",
      });
    }
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
const publishBanner = async (req, res) => {
  try {
    const bannerDetails = await Banner.findById(req.params.bannerId);
    if (!bannerDetails) {
      return res.status(500).json({
        success: false,
        message: "No banner found",
      });
    }
    if (req.body) {
      bannerDetails.is_published = req.body.is_published;
    }
    await bannerDetails.save();
    return res.status(200).json({
      success: true,
      message: "Published",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
const getAllBanner = async (req, res) => {
  try {
    const bannerDetails = await Banner.find();

    if (!bannerDetails) {
      return res.status(500).json({
        success: false,
        message: "No banner found",
      });
    }
    return res.status(200).json({
      success: true,
      bannerDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
const getBannerById = async (req, res) => {
  try {
    const bannerDetails = await Banner.findById(req.params.bannerId);
    if (!bannerDetails) {
      return res.status(500).json({
        success: false,
        message: "No banner",
      });
    }
    return res.status(200).json(bannerDetails);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
module.exports = {
  createBanner,
  editBanner,
  getBannersByBannerTypeAndDetails,
  deleteBanner,
  publishBanner,
  getAllBanner,
  getBannerById,
};
