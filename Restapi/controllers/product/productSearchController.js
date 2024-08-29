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
    const {
      sortBy,
      minPrice: minPriceQuery = 0,
      maxPrice: maxPriceQuery = Infinity,
      discount,
      rating,
      price,
      productTypeId,
      subCategoryId,
      mainCategoryId,
      brandId,
      page = 1, // Default to the first page
      limit = 10, // Default to 10 items per page
    } = req.query;

    console.log(req.query);

    let query = {};

    let minPrice = minPriceQuery;
    let maxPrice = maxPriceQuery;

    if (price) {
      const ranges = price
        .split(",")
        .map((range) => range.split("-").map(Number));
      minPrice = Math.min(...ranges.map(([min]) => min), minPrice);
      maxPrice = Math.max(
        ...ranges.map(([_, max]) => (isNaN(max) ? Infinity : max)),
        maxPrice
      );
    }

    console.log("Calculated minPrice:", minPrice);
    console.log("Calculated maxPrice:", maxPrice);

    if (minPrice !== 0 || maxPrice !== Infinity) {
      query.sellingPrice = {};
      if (minPrice !== 0) query.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice !== Infinity) query.sellingPrice.$lte = parseFloat(maxPrice);
    }

    console.log("Final query:", query);
    
// Discount filter
   if (discount) {
     const discountArray = discount.split(",").map(Number);
     
     const maxDiscount = Math.max(...discountArray);
     query.discount = { $gte: 0, $lte: maxDiscount };
   }

  const variantList = await Variant.find(query).populate({
    path: "productGroup",
    populate: {
      path: "brand",
      model: "Brand",
    },
    model: "Product",
  });


   let filteredVariants = variantList;

   // Rating Filter
   if (rating) {
     const ratingArray = rating.split(",").map(Number);
     const minRating = Math.min(...ratingArray);

     filteredVariants = await Promise.all(
       filteredVariants.map(async (variant) => {
         const review = await ReviewAndRatings.findOne({
           productId: variant.productGroup._id,
           rating: { $gte: minRating },
         });
         return review ? variant : null;
       })
     );

     filteredVariants = filteredVariants.filter((variant) => variant !== null);
   }

   // Main Category Filter
   if (mainCategoryId) {
     filteredVariants = await Promise.all(
       filteredVariants.map(async (variant) => {
         const productDetails = await productSc.findById(variant.productGroup);
         return productDetails &&
           productDetails.categoryId.toString() === mainCategoryId
           ? variant
           : null;
       })
     );

     filteredVariants = filteredVariants.filter((variant) => variant !== null);
   }

   // Sub Category Filter
   if (subCategoryId) {
     filteredVariants = await Promise.all(
       filteredVariants.map(async (variant) => {
         const productDetails = await productSc.findById(variant.productGroup);
         return productDetails &&
           productDetails.subCategoryId.toString() === subCategoryId
           ? variant
           : null;
       })
     );

     filteredVariants = filteredVariants.filter((variant) => variant !== null);
   }

   // Product Type Filter
   if (productTypeId) {
     filteredVariants = await Promise.all(
       filteredVariants.map(async (variant) => {
         const productDetails = await productSc.findById(variant.productGroup);
         return productDetails &&
           productDetails.productTypeId.toString() === productTypeId
           ? variant
           : null;
       })
     );

     filteredVariants = filteredVariants.filter((variant) => variant !== null);
   }

   // Brand Filter
   if (brandId) {
     filteredVariants = await Promise.all(
       filteredVariants.map(async (variant) => {
         const productDetails = await productSc.findById(variant.productGroup);
         return productDetails && productDetails.brand.toString() === brandId
           ? variant
           : null;
       })
     );

     filteredVariants = filteredVariants.filter((variant) => variant !== null);
   }

   // Sorting
   if (sortBy) {
     let sortQuery = {};

     if (sortBy === "price asc") sortQuery = { key: "sellingPrice", order: 1 };
     if (sortBy === "price desc")
       sortQuery = { key: "sellingPrice", order: -1 };
     if (sortBy === "discount") sortQuery = { key: "discount", order: -1 };
     if (sortBy === "customerRatings asc")
       sortQuery = { key: "customerRatings", order: 1 };
     if (sortBy === "customerRatings desc")
       sortQuery = { key: "customerRatings", order: -1 };

     filteredVariants = filteredVariants.sort((a, b) => {
       return (a[sortQuery.key] - b[sortQuery.key]) * sortQuery.order;
     });
   }

   // Pagination
   const totalVariants = filteredVariants.length;
   const paginatedVariants = filteredVariants.slice(
     (page - 1) * limit,
     page * limit
   );

   return res.status(200).json({
     success: true,
     totalItems: totalVariants,
     variants: paginatedVariants,
   });



    // res.status(200).json({
    //   page: parseInt(page),
    //   limit: parseInt(limit),
    //   totalItems: varientList.length,
    //   variants: resultVariants,
    // });
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
