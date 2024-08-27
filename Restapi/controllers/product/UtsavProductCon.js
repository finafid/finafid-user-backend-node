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

    await Promise.all(
      orderDetails.map(async (element) => {
        const products = await Promise.all(
          element.orderItem.map(async (product) => {
            const varientDetails = await Variant.findById(product.productId);
            if (varientDetails && varientDetails.productGroup) {
              const productDetails = await productSc
                .findById(varientDetails.productGroup)
                .populate("brand");
              return productDetails;
            } else {
              return null; // Handle case where variant or productGroup is missing
            }
          })
        );

        // Filter out null values to avoid errors in the following code
        const validProducts = products.filter((product) => product !== null);

        for (let productDetails of validProducts) {
          if (productDetails && productDetails.brand) {
            const brandDetails = await Brand.findById(productDetails.brand);
            if (brandDetails) {
              const brandId = brandDetails._id.toString();
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
        }
      })
    );

    const adminSellingProductDetails = await Brand.find({
      topSellingBrand: true,
    });

    adminSellingProductDetails.forEach((brand) => {
      const brandId = brand._id.toString();

      if (productCountMap.has(brandId)) {
        productCountMap.get(brandId).count += 1;
      } else {
        productCountMap.set(brandId, {
          brand: brand,
          count: 1,
        });
      }
    });

    const result = Array.from(productCountMap.values());
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllTopSellingProduct = async (req, res) => {
  try {
    const orderDetails = await Order.find().populate({
      path: "orderItem.productId",
      populate: {
        path: "productGroup",
        populate: {
          path: "brand",
        },
      },
    });

    let productCountMap = new Map();

    // Process orders and products
    await Promise.all(
      orderDetails.map(async (order) => {
        await Promise.all(
          order.orderItem.map(async (item) => {
            const productDetails = item.productId;

            // Check if productDetails is not null before accessing _id
            if (productDetails) {
              const productId = productDetails._id.toString();

              if (productCountMap.has(productId)) {
                productCountMap.get(productId).count += 1;
              } else {
                productCountMap.set(productId, {
                  product: productDetails,
                  count: 1,
                });
              }
            } else {
              console.error(
                "Product details are null for an item in order:",
                item
              );
            }
          })
        );
      })
    );

    // Fetch top-selling products and populate brand
    const adminSellingProductDetails = await productSc
      .find({
        topSellingProduct: true,
      })
      .populate("brand");

    // Update the map with top-selling products
    adminSellingProductDetails.forEach((product) => {
      if (product) {
        const productId = product._id.toString();

        if (productCountMap.has(productId)) {
          productCountMap.get(productId).count += 1;
        } else {
          productCountMap.set(productId, {
            product: product,
            count: 1,
          });
        }
      } else {
        console.error("Top-selling product is null:", product);
      }
    });

    // Convert the map to an array for the response
    const result = Array.from(productCountMap.values());
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const makeProductTypeIsFeatured = async (req, res) => {
  try {
    const { productTypeId } = req.params;
    const productTypeDetails = await productType.findById(productTypeId);
    console.log(productTypeDetails);
    if (!productTypeDetails) {
      return res
        .status(500)
        .json({ message: " Internal Server Error" });
    }
    productTypeDetails.is_featured=req.body.value;
    await productTypeDetails.save();
    return res.status(200).json({ message: "Completed"});
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
    res.status(200).json(productTypeDetails);
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
