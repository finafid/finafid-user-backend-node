const mainCategory = require("../../models/product/mainCatagory");
const subCategory = require("../../models/product/SubCategory");
const productType = require("../../models/product/productType");
const productSc = require("../../models/product/productSc");
const Brand = require("../../models/brand/brandSc");

const getAllProductInformationBasedOnProduct = async (req, res) => {
  try {
    const productDetails = await productSc.find();
    let objectDetails = [];

    for (let element of productDetails) {
      const categoryName = await findCategoryName(element.categoryId);
      const subCategoryName = await findSubCategoryName(element.subCategoryId);
      const productTypeName = await findProductTypeName(element.productTypeId);
      const brandName = await findBrandName(element.brand);

      const newObject = {
        product: element.name,
        mainCategory: categoryName,
        subCategory: subCategoryName,
        productType: productTypeName,
        brand: brandName,
      };

      objectDetails.push(newObject);
    }

    res.status(200).json(objectDetails);
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

async function findCategoryName(categoryId) {
  try {
    const category = await mainCategory.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    return category.name;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function findSubCategoryName(subCategoryId) {
  try {
    const category = await subCategory.findById(subCategoryId);
    if (!category) {
      throw new Error("Sub-category not found");
    }
    return category.name;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function findProductTypeName(productTypeId) {
  try {
    const type = await productType.findById(productTypeId);
    if (!type) {
      throw new Error("Product type not found");
    }
    return type.name;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function findBrandName(brandId) {
  try {
    const brand = await Brand.findById(brandId);
    if (!brand) {
      throw new Error("Brand not found");
    }
    return brand.name;
  } catch (error) {
    throw new Error(error.message);
  }
}
const axios = require("axios");
const Variant = require("../../models/product/Varient");
const searchEngineLink=process.env.searchEngineLink
const getSearchDataFirst = async (req, res) => {
  try {
    const response = await axios.post("http://laptop-uptfb6dh:8000/search/", {
      query: req.body.query,
    });
    // console.log(response.data.results);
    // for (let element of response.data.results) {
    //   console.log(element.Product);
    // }
     return res.status(200).json(response.data.results);
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getSearchDataSecond = async (req, res) => {
  try {
    const response = await axios.post("http://laptop-uptfb6dh:8000/search/", {
      query: req.body.query,
    });
    let variantList=[]
    for (let element of response.data.results) {
      const productDetails = await productSc
        .findOne({
          name: element.Product,
        })
        .populate({
          path: "variants",
          populate: {
            path: "productGroup",
            model: "Product",
          },
        });

      variantList.push(productDetails.variants);
    }
     return res.status(200).json(variantList);
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};


const getUserSearchData = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
module.exports = {
  getAllProductInformationBasedOnProduct,
  getSearchDataFirst,
  getUserSearchData,
  getSearchDataSecond,
};
