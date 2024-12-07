const varient = require("../../models/product/Varient");
const brand = require("../../models/brand/brandSc");
const UtsavGallery = require("../../models/Utsab/UtsabGalary");
const {
  generateStringOfImageList,
  compressAndResizeImage,
} = require("../../utils/fileUpload");
const Product = require("../../models/product/productSc");

const getImageLink = async (req, res) => {
  try {
    // Extracting file buffer and extension from the request
    const inputImagePath = await req.file.buffer;

    const extension = req.file.originalname.split(".").pop();

    // Define resizing and compression parameters
    const width = null;
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
const getAllNewArrivals = async (req, res) => {
  try {
    const productDetails = await varient
      .find({
        newArrival: true,
      })
      .populate("productGroup");
    if (!productDetails) {
      return res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
    return res.status(200).json({ productDetails: productDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const markAsaNewArrivals = async (req, res) => {
  try {
    const productDetails = await varient.findById(req.params.productId);

    if (!productDetails) {
      return res.status(404).json({ message: "Product not found" });
    }

    productDetails.newArrival = req.body.arrival;
    await productDetails.save();

    const message = productDetails.newArrival
      ? "Product added to New Arrivals"
      : "Product removed from New Arrivals";

    return res.status(200).json({ message, newArrival: productDetails.newArrival });
    
  } catch (error) {
    console.error("Error marking product as new arrival:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const getAllUtsavFeaturedBrand = async (req, res) => {
  try {
    const productDetails = await brand.find({
      utsavFeatured: true,
    });
    if (!productDetails) {
      return res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
    return res.status(200).json({ productDetails: productDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const markAsaUtsavFeaturedBrand = async (req, res) => {
  try {
    const productDetails = await brand.findById(req.params.brandId);

    if (!productDetails) {
      return res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
    productDetails.utsavFeatured = req.body.utsavFeatured;
    await productDetails.save();
    return res.status(200).json({ productDetails: productDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const createUtsavGallery = async (req, res) => {
  try {
    const { categoryId, description, title } = req.body;
    let bannerImg = "";
    if (req.file) {
      bannerImg = await getImageLink(req);
    }
    const newUtsavGallery = new UtsavGallery({
      categoryId,
      description,
      title,
      bannerImg,
    });
    if (!newUtsavGallery) {
      return res.status(500).json({ message: "Cannot do it " });
    }
    await newUtsavGallery.save();
    return res.status(200).json({ message: " Successfully created" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getAllGallery = async (req, res) => {
  try {
    const galleryDetails = await UtsavGallery.find().populate("categoryId");
    return res.status(200).json({ galleryDetails: galleryDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getGalleryDetailsById = async (req, res) => {
  try {
    const galleryDetails = await UtsavGallery.findById(req.params.galleryId);
    if (!galleryDetails) {
      return res.status(500).json({ message: " Internal Server Error" });
    }

    return res.status(200).json({ galleryDetails: galleryDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getGalleryProductsById = async (req, res) => {
  try {
    const galleryDetails = await UtsavGallery.findById(req.params.galleryId);
    if (!galleryDetails) {
      return res.status(500).json({ message: " Internal Server Error" });
    }
    const productList = await Product.find({
      category: galleryDetails.categoryId,
      is_utsav: true,
    }).populate({
      path: "variants",
    });

    return res.status(200).json({ productList: productList });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const editGalleryDetails = async (req, res) => {
  try {
    const galleryDetails = await UtsavGallery.findById(req.params.galleryId);
    if (!galleryDetails) {
      return res.status(500).json({ message: " Internal Server Error" });
    }
     // console.log(req.body)
     // console.log(req.file);
   if (req.file) {
     newBannerImg = await getImageLink(req);
     galleryDetails.bannerImg = newBannerImg;
     await galleryDetails.save();
   }
   if(req.body){
    galleryDetails.title=req.body.title;
    galleryDetails.categoryId = req.body.categoryId;
    galleryDetails.description = req.body.description;
    await galleryDetails.save();
   }
    return res.status(200).json({ galleryDetails: galleryDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const deleteGalleryById = async (req, res) => {
  try {
    const galleryDetails = await UtsavGallery.findByIdAndDelete(
      req.params.galleryId
    );
    if (!galleryDetails) {
      return res.status(404).json({ message: "Gallery not found" });
    }
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};

const publishGalleryById = async (req, res) => {
  try {
    const galleryDetails = await UtsavGallery.findById(
      req.params.galleryId
    );
    if (!galleryDetails) {
      return res.status(500).json({ message: " Internal Server Error" });
    }
    galleryDetails.is_published = req.body.is_published;
    await galleryDetails.save();
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getAllPublishedGallery = async (req, res) => {
  try {
    const galleryDetails = await UtsavGallery.find({
      is_published:true
    }).populate("categoryId");
    return res.status(200).json({ galleryDetails: galleryDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
module.exports = {
  getAllNewArrivals,
  markAsaNewArrivals,
  getAllUtsavFeaturedBrand,
  markAsaUtsavFeaturedBrand,
  createUtsavGallery,
  getAllGallery,
  getGalleryDetailsById,
  deleteGalleryById,
  editGalleryDetails,
  publishGalleryById,
  getGalleryProductsById,
  getAllPublishedGallery,
};
