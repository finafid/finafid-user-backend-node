const mainCategory = require("../../models/product/mainCatagory");
const subCategory = require("../../models/product/SubCategory");
const productType = require("../../models/product/productType");
const productSc = require("../../models/product/productSc");
const Brand = require("../../models/brand/brandSc");
const ProductSearch = require("../../models/product/productSearchSchema");
const Variant = require("../../models/product/Varient.js");
const Order = require("../../models/Order/orderSc.js");
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
    const filteredVariants = variantList.filter(
      (variant) => variant.isUtsav === false
    );

    res.status(200).json({ productDetails: filteredVariants });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const makeTopSellingProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const productDetails = await productSc.findById(productId);
    if (!productDetails) {
      res.status(500).json({ message: "No such product" });
    }
    productDetails.topSellingProduct = req.body.value;
    await productDetails.save();
    res.status(200).json({ message: "Completed" });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const makeTopSellingBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const brandDetails = await Brand.findById(brandId);
    if (!brandDetails) {
      res.status(500).json({ message: "No such product" });
    }
    brandDetails.topSellingBrand = req.body.value;
    await brandDetails.save();
    res.status(200).json({ message: "Completed" });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllTopSellingBrand = async (req, res) => {
  try {
    const orderDetails = await Order.find();
    let productCountMap = new Map();

    for (let element of orderDetails) {
      for (let product of element.orderItem) {
        const varientDetails = await Variant.findById(product.productId);
        const productDetails = await productSc
          .findById(varientDetails.productGroup)
          .populate("brand");

        const brandDetails = await Brand.findById(productDetails.brand);

        const brandId = brandDetails._id.toString(); // Use the unique brand ID as the key

        if (productCountMap.has(brandId)) {
          productCountMap.get(brandId).count += 1;
        } else {
          productCountMap.set(brandId, {
            brand: brandDetails,
            count: 1,
          });
        }
      }
    }
    const adminSellingProductDetails = await Brand.find({
      topSellingBrand: true,
    });
    if (adminSellingProductDetails) {
      for (let brand of adminSellingProductDetails) {
        const brandId = brand._id.toString(); // Use the unique brand ID as the key

        if (productCountMap.has(brandId)) {
          productCountMap.get(brandId).count += 1;
        } else {
          productCountMap.set(brandId, {
            brand: brand,
            count: 1,
          });
        }
      }
    }
    const result = Array.from(productCountMap.values());
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllTopSellingProduct = async (req, res) => {
  try {
    const orderDetails = await Order.find();
    let productCountMap = new Map();

    for (let element of orderDetails) {
      for (let product of element.orderItem) {
        const varientDetails = await Variant.findById(product.productId);
        const productDetails = await productSc
          .findById(varientDetails.productGroup)
          .populate("brand");

        const productId = productDetails._id.toString(); // Use the unique ID as the key

        if (productCountMap.has(productId)) {
          productCountMap.get(productId).count += 1;
        } else {
          productCountMap.set(productId, {
            product: productDetails,
            count: 1,
          });
        }
      }
    }

    const adminSellingProductDetails = await productSc
      .find({
        topSellingProduct: true,
      })
      .populate("brand");

    if (adminSellingProductDetails) {
      for (let product of adminSellingProductDetails) {
        const productId = product._id.toString();

        if (productCountMap.has(productId)) {
          productCountMap.get(productId).count += 1;
        } else {
          productCountMap.set(productId, {
            product: product,
            count: 1,
          });
        }
      }
    }

    const result = Array.from(productCountMap.values());
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const makeProductTypeIsFeatured = async (req, res) => {
  try {
    const { productTypeId } = req.params;
    const productTypeDetails = await productType.findById(productTypeId);
    if (!productTypeDetails) {
      return res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
    productTypeDetails.is_featured=req.body.value;
    await productTypeDetails.save();
    return res.status(500).json({ message: error.message + " Internal Server Error" });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllFeaturedProductType = async (req, res) => {
  try {
    const productTypeDetails = await productType.find({
      is_featured:true
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
module.exports = {
  getAllUtsavProduct,
  getAllUtsavProductBasedOnCategory,
  makeTopSellingProduct,
  makeTopSellingBrand,
  getAllTopSellingBrand,
  getAllTopSellingProduct,
  makeProductTypeIsFeatured,
  getAllFeaturedProductType,
};
