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
const applyFilter = async (filteredVariants, filterKey, filterValue) => {
  if (!filterValue) return filteredVariants;

  // Extract all productGroup IDs from filteredVariants
  const productGroupIds = filteredVariants.map(
    (variant) => variant.productGroup
  );

  // Batch fetch all product details
  const productDetailsMap = await productSc
    .find({ _id: { $in: productGroupIds } })
    .lean();

  // Create a map for fast lookup
  const productDetailsLookup = productDetailsMap.reduce((acc, product) => {
    acc[product._id] = product;
    return acc;
  }, {});

  // Filter the variants based on the filterKey and filterValue
  return filteredVariants.filter((variant) => {
    const productDetails = productDetailsLookup[variant.productGroup];
    return (
      productDetails && productDetails[filterKey].toString() === filterValue
    );
  });
};

const getAllVariantsOnUser = async (req, res) => {
  try {
    const {
      sortBy,
      minPrice,
      maxPrice,
      discount,
      rating,
      price,
      productTypeId,
      subCategoryId,
      mainCategoryId,
      brandId,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    // Handle Price Range
    if (price) {
      const ranges = price
        .split(",")
        .map((range) => range.split("-").map(Number));
      const minValues = ranges.map(([min]) => min);
      const maxValues = ranges.map(([_, max]) => (isNaN(max) ? Infinity : max));

      const calculatedMinPrice = Math.min(...minValues);
      const calculatedMaxPrice = Math.max(...maxValues);

      query.sellingPrice = {};
      if (calculatedMinPrice !== Infinity)
        query.sellingPrice.$gte = calculatedMinPrice;
      if (calculatedMaxPrice !== Infinity)
        query.sellingPrice.$lte = calculatedMaxPrice;
    } else if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice);
    }

    // Handle Discount Filter
    if (discount) {
      const discountArray = discount.split(",").map(Number);
      const maxDiscount = Math.max(...discountArray);
      query.discount = { $gte: 0, $lte: maxDiscount };
    }

    // Initial fetch of variants
    let filteredVariants = await Variant.find(query).lean();

    // Apply filters
    filteredVariants = await applyFilter(
      filteredVariants,
      "categoryId",
      mainCategoryId
    );
    filteredVariants = await applyFilter(
      filteredVariants,
      "subCategoryId",
      subCategoryId
    );
    filteredVariants = await applyFilter(
      filteredVariants,
      "productTypeId",
      productTypeId
    );
    filteredVariants = await applyFilter(filteredVariants, "brand", brandId);

    // If there are no filtered variants, return early
    if (filteredVariants.length === 0) {
      return res.status(200).json({
        success: true,
        totalItems: 0,
        variants: [],
      });
    }

    const variantIds = filteredVariants.map((variant) => variant._id);

    let aggregatePipeline = [
      {
        $match: {
          _id: { $in: variantIds },
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "productGroup._id",
          foreignField: "productId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviews.rating" },
        },
      },
    ];

    if (rating) {
      const minRating = Math.min(...rating.split(",").map(Number));
      aggregatePipeline.push({
        $match: { avgRating: { $gte: minRating } },
      });
    }

    // Sorting
    if (sortBy) {
      const sortFields = {
        "price asc": { sellingPrice: 1 },
        "price desc": { sellingPrice: -1 },
        discount: { discount: -1 },
        "customerRatings asc": { avgRating: 1 },
        "customerRatings desc": { avgRating: -1 },
      };
      aggregatePipeline.push({ $sort: sortFields[sortBy] || {} });
    }

    // Pagination
    aggregatePipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    );

    // Execute the Aggregate Pipeline
    const variantList = await Variant.aggregate(aggregatePipeline).exec();

    return res.status(200).json({
      success: true,
      totalItems: variantList.length,
      variants: variantList,
    });
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

const getBrandsBasedOnProductType = async (req, res) => {
  try {
    const productTypeId = req.params.productTypeId; // Extract the productTypeId from the request parameters

    const brandList = await Brand.find({
      productTypeList: { $in: [productTypeId] },
    });
    if (!brandList) {
      return res.status(500).json({ message: " Internal Server Error" });
    }
    return res.status(200).json({ brandList: brandList });
  } catch (error) {
    console.error("Error fetching variants:", error);
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const getProductTypesBasedOnBrand = async (req, res) => {
  try {
    const brandDetails = await Brand.findById(req.params.brandId).populate(
      "productTypeList"
    );
    if (!brandDetails) {
      return res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
    return res
      .status(200)
      .json({ ProductTypeList: brandDetails.productTypeList });
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
  getProductTypesBasedOnBrand,
  getBrandsBasedOnProductType,
};
