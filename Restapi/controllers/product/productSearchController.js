const mainCategory = require("../../models/product/mainCatagory");
const subCategory = require("../../models/product/SubCategory");
const productType = require("../../models/product/productType");
const productSc = require("../../models/product/productSc");
const Brand = require("../../models/brand/brandSc");
const ProductSearch = require("../../models/product/productSearchSchema");
const Variant = require("../../models/product/Varient.js");
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
const getAllVariants = async (req, res) => {
  try {
    const {
      sortBy,
      priceMin,
      priceMax,
      discountMin=0,
      discountMax,
      ratingMin,
      ratingMax=5,
    } = req.query;

    let query = {};

    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }

    if (discountMin || discountMax) {
      query.discount = {};
      if (discountMin) query.discount.$gte = parseFloat(discountMin);
      if (discountMax) query.discount.$lte = parseFloat(discountMax);
    }


    if (ratingMin || ratingMax) {
      query.customerRatings = {};
      if (ratingMin) query.customerRatings.$gte = parseFloat(ratingMin);
      if (ratingMax) query.customerRatings.$lte = parseFloat(ratingMax);
    }


    let variants = await Variant.find(query).populate({
      path: "productGroup",
      populate: {
        path: "productTypeId",
      },
    });

  
    if (sortBy) {
      let sortQuery = {};
      if (sortBy === "price") sortQuery.price = 1; // 1 for ascending, -1 for descending
      if (sortBy === "discount") sortQuery.discount = 1;
      if (sortBy === "ratings") sortQuery.customerRatings = 1;
      variants = variants.sort(sortQuery);
    }

    // Return the filtered and sorted variants
    res.status(200).json(variants);
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

module.exports = {
  getAllSearchTypeBasedOnSubCategory,
  getAllSearchTypeBasedOnProductType,
  getAllSearchTypeBasedOnProduct,
  getAllVariants,
};
