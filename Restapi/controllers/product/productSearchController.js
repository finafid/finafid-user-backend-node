const mainCategory = require("../../models/product/mainCatagory");
const subCategory = require("../../models/product/SubCategory");
const productType = require("../../models/product/productType");
const productSc = require("../../models/product/productSc");
const Brand = require("../../models/brand/brandSc");
const ProductSearch = require("../../models/product/productSearchSchema");
const Variant = require("../../models/product/Varient.js");
const ReviewAndRatings = require("../../models/product/ReviewAndRatings.js");
const getAllSearchTypeBasedOnSubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const productList = await productSc.find({ subCategoryId });

    let variationMap = {};

    productList.forEach((element) => {
      const variation = element.variation;

      // Iterate over the keys of the variation object
      Object.keys(variation).forEach((key) => {
        if (!variationMap[key]) {
          // If the key does not exist in the map, add it
          variationMap[key] = variation[key];
        } else {
          // If the key exists, combine the values
          variationMap[key] = mergeValues(variationMap[key], variation[key]);
        }
      });
    });

    res.status(200).json({ productDetails: variationMap });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

// Helper function to merge values
function mergeValues(existingValue, newValue) {
  if (Array.isArray(existingValue) && Array.isArray(newValue)) {
    // Merge arrays and remove duplicates
    return Array.from(new Set([...existingValue, ...newValue]));
  } else if (
    typeof existingValue === "object" &&
    typeof newValue === "object"
  ) {
    return { ...existingValue, ...newValue };
  } else {
    return newValue;
  }
}

const getAllSearchTypeBasedOnProductType = async (req, res) => {
  try {
    const { productTypeId } = req.params;
    const productList = await productSc.find({
      productTypeId,
    });
    let variationList = [];
    variationList = productList.forEach((element) => {
      variationList = [...new Set(element.variants)];
    });

    res.status(200).json({ productDetails: variationList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllSearchTypeBasedOnProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const productDetails = await productSc.findById(productId);
    const productList = await productSc.find({
      productTypeId: productDetails.productTypeId,
    });
    let variationList = [];
    variationList = productList.forEach((element) => {
      variationList = [...new Set(element.variants)];
    });
    res.status(200).json({ productDetails: variationList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllVariantsOnUser = async (req, res) => {
  try {
    console.log(req.query);
    const {
      sortBy,
      minPrice,
      maxPrice,
      discount,
      rating,
      productTypeId,
      subCategoryId,
      mainCategoryId,
      brandId,
      page = 1, // Default to the first page
      limit = 10, // Default to 10 items per page
    } = req.query;

    let query = {};

    // Price filter
    if (maxPrice || minPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice);
    }

    // Discount filter
   if (discount) {
     const discountArray = discount.split(",").map(Number);
     
     const maxDiscount = Math.max(...discountArray);
     query.discount = { $gte: 0, $lte: maxDiscount };
   }


    let variants = await Variant.find(query)
      .populate("productGroup")
      .skip((page - 1) * limit) // Skip previous pages
      .limit(parseInt(limit)); // Limit to the number of items per page

    let resultVariants = [];

    // Rating filter
    if (rating) {
      const ratingArray = rating.split(",").map(Number);
      const minRating = Math.min(...ratingArray);
      variants = await Promise.all(
        variants.map(async (element) => {
          console.log(element.productGroup._id);
          const review = await ReviewAndRatings.findOne({
            productId: element.productGroup._id,
             rating: { $gte: minRating },
          });
          if (review) return element;
        })
      );

      variants = variants.filter((variant) => variant !== undefined);
    }

    // Main Category filter
    if (mainCategoryId) {
      variants = await Promise.all(
        variants.map(async (element) => {
          const productDetails = await productSc.findById(element.productGroup);
          if (
            productDetails &&
            productDetails.categoryId.toString() === mainCategoryId
          ) {
            return element;
          }
        })
      );

      variants = variants.filter((variant) => variant !== undefined);
    }

    // Sub Category filter
    if (subCategoryId) {
      variants = await Promise.all(
        variants.map(async (element) => {
          const productDetails = await productSc.findById(element.productGroup);
          if (
            productDetails &&
            productDetails.subCategoryId.toString() === subCategoryId
          ) {
            return element;
          }
        })
      );

      variants = variants.filter((variant) => variant !== undefined);
    }

    // Product Type filter
    if (productTypeId) {
      variants = await Promise.all(
        variants.map(async (element) => {
          const productDetails = await productSc.findById(element.productGroup);
          if (
            productDetails &&
            productDetails.productTypeId.toString() === productTypeId
          ) {
            return element;
          }
        })
      );

      variants = variants.filter((variant) => variant !== undefined);
    }

    // Brand filter
    if (brandId) {
      variants = await Promise.all(
        variants.map(async (element) => {
          const productDetails = await productSc.findById(element.productGroup);
          if (productDetails && productDetails.brand.toString() === brandId) {
            return element;
          }
        })
      );

      variants = variants.filter((variant) => variant !== undefined);
    }

    resultVariants = variants;

    // Sorting
   if (sortBy) {
     let sortQuery = {};

     if (sortBy === "price asc") sortQuery = { key: "sellingPrice", order: 1 };
     if (sortBy === "price desc") sortQuery = { key: "sellingPrice", order: -1 };
     if (sortBy === "discount") sortQuery = { key: "discount", order: -1 };
     if (sortBy === "customerRatings asc")
       sortQuery = { key: "customerRatings", order: 1 };
     if (sortBy === "customerRatings desc")
       sortQuery = { key: "customerRatings", order: -1 };

     resultVariants = resultVariants.sort((a, b) => {
       return (a[sortQuery.key] - b[sortQuery.key]) * sortQuery.order;
     });
   }


    res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems: resultVariants.length,
      variants: resultVariants,
    });
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};



module.exports = {
  getAllSearchTypeBasedOnSubCategory,
  getAllSearchTypeBasedOnProductType,
  getAllSearchTypeBasedOnProduct,
  getAllVariantsOnUser,
};
