const mainCategory = require("../../models/product/mainCatagory");
const subCategory = require("../../models/product/SubCategory");
const productType = require("../../models/product/productType");
const productSc = require("../../models/product/productSc");
const Brand = require("../../models/brand/brandSc");
const ProductSearch = require("../../models/product/productSearchSchema");
const Variant = require("../../models/product/Varient.js");
const getAllUtsavProduct = async (req, res) => {
  try {
   const productDetails = await Variant.find({
     isUtsav: true,
   }).populate("productGroup");
   res.status(200).json({ productDetails: productDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllUtsavProductBasedOnCategory = async (req, res) => {
  try {
    const productDetails = await productSc
      .find({
        categoryId: req.params.categoryId,
      })
      .populate("variants");

    if (!productDetails || productDetails.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }
    const variantList = [];
    productDetails.forEach((element) => {
      if (Array.isArray(element.variants)) {
        variantList.push(...element.variants);
      } else if (element.variants) {
        variantList.push(element.variants);
      }
    });
     const filteredVariants = variantList.filter((variant) => variant.isUtsav===false);

    res.status(200).json({ productDetails: filteredVariants });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

module.exports = {
  getAllUtsavProduct,
  getAllUtsavProductBasedOnCategory,
};