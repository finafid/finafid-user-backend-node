const DealOfTheDay = require("../../models/Coupons/DealOfTheDay");
const FeaturedDeal = require("../../models/Coupons/featuredDeal");
const FlashDeal = require("../../models/Coupons/FlashDeals");
const mongoose = require("mongoose");
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
const createFlashDeal = async (req, res) => {
  try {
    const { title, start_Date, end_Date, products } = req.body;
    const startDay = new Date(start_Date);
    const endDay = new Date(end_Date);
    const banner = await getImageLink(req);
    const newFlashDeal = new FlashDeal({
      title,
      start_Date: startDay,
      end_Date: endDay,
      products,
      banner,
    });
    await newFlashDeal.save();
    if (!newFlashDeal) {
      return res.status(500).json({
        success: false,
        message: "Cannot create",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Created Successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};

const createFeaturedDeal = async (req, res) => {
  try {
    const { title, start_Date, end_Date, products } = req.body;
    const startDay = new Date(start_Date);
    const endDay = new Date(end_Date);
    const banner = await getImageLink(req);
    const newFeaturedDeal = new FeaturedDeal({
      title,
      start_Date: startDay,
      end_Date: endDay,
      products,
      banner,
    });
    if (!newFeaturedDeal) {
      return res.status(500).json({
        success: false,
        message: "Cannot create",
      });
    }
    await newFeaturedDeal.save();
    return res.status(200).json({
      success: true,
      message: "Created Successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};

const createDealOfTheDay = async (req, res) => {
  try {
    const { title, productId } = req.body;
    const banner = await getImageLink(req);
    const newDealOfTheDay = new DealOfTheDay({
      title,
      productId,
      banner,
    });
    if (!newDealOfTheDay) {
      return res.status(500).json({
        success: false,
        message: "Cannot create",
      });
    }
    await newDealOfTheDay.save();
    return res.status(200).json({
      success: true,
      message: "Created Successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getAllFlashDeal = async (req, res) => {
  try {
    const flashDealDetails = await FlashDeal.find();
    if (!flashDealDetails) {
      return res.status(500).json({
        success: false,
        message: " No deals",
      });
    }
    return res.status(200).json({
      flashDealDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getAllFeaturedDeals = async (req, res) => {
  try {
    const featuredDealsDetails = await FeaturedDeal.find();
    if (!featuredDealsDetails) {
      return res.status(500).json({
        success: false,
        message: " No deals",
      });
    }
    return res.status(200).json({
      featuredDealsDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getDealOfTheDay = async (req, res) => {
  try {
    const dealOfTheDayDetails = await DealOfTheDay.find().populate({
      path: "productId",
      populate: {
        path: "productGroup",
        model: "Product", // Adjust to your actual model name
      },
    });;
    if (!dealOfTheDayDetails) {
      return res.status(500).json({
        success: false,
        message: " No deals",
      });
    }
    return res.status(200).json({
      dealOfTheDayDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getFlashDealById = async (req, res) => {
  try {
    const dealDetails = await FlashDeal.findOne({
      _id: req.params.dealId,
    }).populate({
      path: "products",
      populate: {
        path: "productGroup",
        model: "Product", // Adjust to your actual model name
      },
    });
    if (!dealDetails) {
      return res.status(500).json({
        success: false,
        message: "No such deal",
      });
    }
    //   const startDate = new Date(dealDetails.start_Date);
    //  const endDate = new Date(dealDetails.end_Date);
    //   const currentDate=Date.now();
    //   if(currentDate>endDate){
    //     return res.status(500).json({
    //     success: false,
    //     message: "Deal expired",
    //   })
    //   }
    //   if (currentDate < startDate) {
    //     return res.status(500).json({
    //       success: false,
    //       message: "Deal Not started yet",
    //     });
    //   }

    return res.status(200).json({
      success: true,
      dealDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getFeaturedDealById = async (req, res) => {
  try {
    const dealDetails = await FeaturedDeal.findOne({
      _id: req.params.dealId,
    }).populate({
      path: "products",
      populate: {
        path: "productGroup",
        model: "Product", // Adjust to your actual model name
      },
    });
    if (!dealDetails) {
      return res.status(500).json({
        success: false,
        message: "No such deal",
      });
    }
    // const startDate = new Date(dealDetails.start_Date);
    // const endDate = new Date(dealDetails.end_Date);
    // const currentDate = Date.now();
    // if (currentDate > endDate) {
    //   return res.status(500).json({
    //     success: false,
    //     message: "Deal expired",
    //   });
    // }
    // if (currentDate < startDate) {
    //   return res.status(500).json({
    //     success: false,
    //     message: "Deal Not started yet",
    //   });
    // }

    return res.status(200).json({
      success: true,
      dealDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getDEalOfTheDayById = async (req, res) => {
  try {
    const dealDetails = await DealOfTheDay.findOne({
      _id: req.params.dealId,
    }).populate({
      path: "productId",
      populate: {
        path: "productGroup",
        model: "Product", // Adjust to your actual model name
      },
    });
    if (!dealDetails) {
      return res.status(500).json({
        success: false,
        message: "No such deal",
      });
    }
    return res.status(200).json({
      success: true,
      dealDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const deleteDealOfTheDay = async (req, res) => {
  try {
    const dealDetails = await DealOfTheDay.findByIdAndDelete(req.params.dealId);
    if (!dealDetails){
      return res.status(500).json({
        success: false,
        message: "Not deleted",
      });
    }
      return res.status(200).json({
        success: true,
        message: "Deleted successfully",
      });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const deleteFeaturedDeal = async (req, res) => {
  try {
    const dealDetails = await FeaturedDeal.findByIdAndDelete(req.params.dealId);
    if (!dealDetails) {
      return res.status(500).json({
        success: false,
        message: "Not deleted",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const deleteFlashDeal = async (req, res) => {
  try {
    const dealDetails = await FlashDeal.findByIdAndDelete({
      _id: req.params.dealId,
    });
    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const editDEalOfTheDayById = async (req, res) => {
  try {
    const dealDetails = await DealOfTheDay.findOne({
      _id: req.params.dealId,
    });
    if (req.file) {
      const uploadUrl = await getImageLink(req);
      dealDetails.banner = uploadUrl;
      await dealDetails.save();
    }
    if (req.body) {
      dealDetails.title = req.body.title;
      dealDetails.productId = req.body.productId;
      await dealDetails.save();
    }
    await dealDetails.save();
    return res.status(200).json({
      success: true,
      message: "edited successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const editFeaturedDealById = async (req, res) => {
  try {
    const dealDetails = await FeaturedDeal.findById(req.params.dealId);
    if (!dealDetails) {
      return res.status(500).json({
        success: false,
        message: "No deal present",
      });
    }
    if (req.file) {
      const uploadUrl = await getImageLink(req);
      dealDetails.banner = uploadUrl;
      await dealDetails.save();
    }
    if (req.body) {
      dealDetails.title = req.body.title;
      const startDay = new Date(req.body.start_Date);
      const endDay = new Date(req.body.end_Date);
      dealDetails.start_Date = startDay;
      dealDetails.end_Date = endDay;
      await dealDetails.save();
    }
    return res.status(200).json({
      success: true,
      message: "Deal edited successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const editFlashDealById = async (req, res) => {
  try {
    const dealDetails = await FlashDeal.findById({
      _id: req.params.dealId,
    });

    if (!dealDetails) {
      return res.status(500).json({
        success: false,
        message: "No deal present",
      });
    }
    if (req.file) {
      const uploadUrl = await getImageLink(req);
      dealDetails.banner = uploadUrl;
      await dealDetails.save();
    }
    if (req.body) {
      dealDetails.title = req.body.title;
      const startDay = new Date(req.body.start_Date);
      const endDay = new Date(req.body.end_Date);
      dealDetails.start_Date = startDay;
      dealDetails.end_Date = endDay;
      await dealDetails.save();
    }

    return res.status(200).json({
      success: true,
      message: "edited successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const addProductFlashDeal = async (req, res) => {
  try {
    const dealDetails = await FlashDeal.findOne({
      _id: req.params.dealId,
    });

    if (req.body.products !== undefined) {
      const validProductIds = req.body.products.every((productId) =>
        mongoose.Types.ObjectId.isValid(productId)
      );
       // console.log(req.body);
      if (!validProductIds) {
        return res.status(400).json({ message: "Invalid product ID(s)" });
      }
      const productsDetails = req.body.products.map(
        (productId) => new mongoose.Types.ObjectId(productId)
      );

      dealDetails.products.push(...productsDetails);
    }
    await dealDetails.save();
    return res.status(200).json({
      success: true,
      message: "edited successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const addProductFeaturedDeal = async (req, res) => {
  try {
    const dealDetails = await FeaturedDeal.findById(req.params.dealId);

    if (req.body.products !== undefined) {
      const validProductIds = req.body.products.every((productId) =>
        mongoose.Types.ObjectId.isValid(productId)
      );
       // console.log(req.body);
      if (!validProductIds) {
        return res.status(400).json({ message: "Invalid product ID(s)" });
      }
      const productsDetails = req.body.products.map(
        (productId) => new mongoose.Types.ObjectId(productId)
      );

      dealDetails.products.push(...productsDetails);
    }
    await dealDetails.save();
    return res.status(200).json({
      success: true,
      message: "edited successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const updateStatusFlashDeal = async (req, res) => {
  try {
    const dealDetails = await FlashDeal.findOne({
      _id: req.params.dealId,
    });

    if (req.body) {
      dealDetails.status = req.body.status;
    }
    await dealDetails.save();
    return res.status(200).json({
      success: true,
      message: "edited successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const updateStatusFeaturedDeal = async (req, res) => {
  try {
    const dealDetails = await FeaturedDeal.findById(req.params.dealId);

    if (req.body) {
      dealDetails.status = req.body.status;
    }
    await dealDetails.save();
    return res.status(200).json({
      success: true,
      message: "edited successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const updateStatusDealOfTheDay = async (req, res) => {
  try {
    const dealDetails = await DealOfTheDay.findById(req.params.dealId);

    if (req.body) {
      dealDetails.status = req.body.status;
    }
    await dealDetails.save();
    return res.status(200).json({
      success: true,
      message: "edited successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};

const deleteProductFlashDeal = async (req, res) => {
  try {
    const { productId } = req.body;
    const dealDetails = await FlashDeal.findOne({
      _id: req.params.dealId,
    });
     // console.log(req.body);
    if (req.body == undefined) {
      return res.status(500).json({
        success: false,
        message: "No data is coming",
      });
    }
    if (req.body.productId !== undefined) {
      const validProductIds = mongoose.Types.ObjectId.isValid(productId);
      if (!validProductIds) {
        return res.status(400).json({ message: "Invalid product ID(s)" });
      }
      const productsDetails = new mongoose.Types.ObjectId(productId);
      dealDetails.products.remove(productsDetails);
    }
    await dealDetails.save();
    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const deleteProductFeaturedDeal = async (req, res) => {
  try {
    const { productId } = req.body;
    const dealDetails = await FeaturedDeal.findOne({
      _id: req.params.dealId,
    });
     // console.log(req.body);
    if (req.body == undefined) {
      return res.status(500).json({
        success: false,
        message: "No data is coming",
      });
    }
    if (req.body.productId !== undefined) {
      const validProductIds = mongoose.Types.ObjectId.isValid(productId);
      if (!validProductIds) {
        return res.status(400).json({ message: "Invalid product ID(s)" });
      }
      const productsDetails = new mongoose.Types.ObjectId(productId);
      dealDetails.products.remove(productsDetails);
    }
    await dealDetails.save();
    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getAllFlashDealOnUser = async (req, res) => {
  try {
    const flashDealDetails = await FlashDeal.find({ status: true });
    if (!flashDealDetails) {
      return res.status(500).json({
        success: false,
        message: " No deals",
      });
    }
    return res.status(200).json({
      flashDealDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getAllFeaturedDealsOnUser = async (req, res) => {
  try {
    const featuredDealsDetails = await FeaturedDeal.find({
      status:true
    });
    if (!featuredDealsDetails) {
      return res.status(500).json({
        success: false,
        message: " No deals",
      });
    }
    return res.status(200).json({
      featuredDealsDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getDealOfTheDayOnUser = async (req, res) => {
  try {
    const dealOfTheDayDetails = await DealOfTheDay.find({
      status: true,
    }).populate({
      path: "productId",
      populate: {
        path: "productGroup",
        model: "Product", // Adjust to your actual model name
      },
    });
    if (!dealOfTheDayDetails) {
      return res.status(500).json({
        success: false,
        message: " No deals",
      });
    }
    return res.status(200).json({
      dealOfTheDayDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getFlashDealByIdOnUser = async (req, res) => {
  try {
    const dealDetails = await FlashDeal.findOne({
      _id: req.params.dealId,
    }).populate({
      path: "products",
      populate: {
        path: "productGroup",
        model: "Product", // Adjust to your actual model name
      },
    });
    if (!dealDetails) {
      return res.status(500).json({
        success: false,
        message: "No such deal",
      });
    }
      const startDate = new Date(dealDetails.start_Date);
     const endDate = new Date(dealDetails.end_Date);
      const currentDate=Date.now();
      if(currentDate>endDate){
        return res.status(500).json({
        success: false,
        message: "Deal expired",
      })
      }
      if (currentDate < startDate) {
        return res.status(500).json({
          success: false,
          message: "Deal Not started yet",
        });
      }

    return res.status(200).json({
      success: true,
      dealDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getFeaturedDealByIdOnUser = async (req, res) => {
  try {
   const dealDetails = await FeaturedDeal.findOne({
     _id: req.params.dealId,
   }).populate({
     path: "products",
     populate: {
       path: "productGroup",
       populate: {
         path: "brand", // populate brand inside productGroup
         model: "Brand", // adjust the model if necessary
       },
     },
   });

    if (!dealDetails) {
      return res.status(500).json({
        success: false,
        message: "No such deal",
      });
    }
    const startDate = new Date(dealDetails.start_Date);
    const endDate = new Date(dealDetails.end_Date);
    const currentDate = Date.now();
    if (currentDate > endDate) {
      return res.status(500).json({
        success: false,
        message: "Deal expired",
      });
    }
    if (currentDate < startDate) {
      return res.status(500).json({
        success: false,
        message: "Deal Not started yet",
      });
    }

    return res.status(200).json({
      success: true,
      dealDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
const getDEalOfTheDayByIdOnUser = async (req, res) => {
  try {
    const dealDetails = await DealOfTheDay.findOne({
      _id: req.params.dealId,
    }).populate({
      path: "productId",
      populate: {
        path: "productGroup",
        model: "Product", // Adjust to your actual model name
      },
    });
    if (!dealDetails) {
      return res.status(500).json({
        success: false,
        message: "No such deal",
      });
    }
    return res.status(200).json({
      success: true,
      dealDetails,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};
module.exports = {
  createFlashDeal,
  createFeaturedDeal,
  createDealOfTheDay,
  getAllFlashDeal,
  getAllFeaturedDeals,
  getDealOfTheDay,
  getFlashDealById,
  getFeaturedDealById,
  getDEalOfTheDayById,
  deleteDealOfTheDay,
  deleteFeaturedDeal,
  deleteFlashDeal,
  editDEalOfTheDayById,
  editFeaturedDealById,
  editFlashDealById,
  addProductFlashDeal,
  addProductFeaturedDeal,
  updateStatusFlashDeal,
  updateStatusFeaturedDeal,
  updateStatusDealOfTheDay,
  deleteProductFlashDeal,
  deleteProductFeaturedDeal,
  getAllFlashDealOnUser,
  getAllFeaturedDealsOnUser,
  getDealOfTheDayOnUser,
  getFlashDealByIdOnUser,
  getFeaturedDealByIdOnUser,
  getDEalOfTheDayByIdOnUser,
};
