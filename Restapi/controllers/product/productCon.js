const mainCategory = require("../../models/product/mainCatagory");
const subCategory = require("../../models/product/SubCategory");
const productType = require("../../models/product/productType");
const productSc = require("../../models/product/productSc");
const Brand = require("../../models/brand/brandSc");
const ProductSearch = require("../../models/product/productSearchSchema");
const {
  generateStringOfImageList,
  compressAndResizeImage,
} = require("../../utils/fileUpload");
const Product = require("../../models/product/productSc");
const getImageLink = async (req, res) => {
  try {
    // Extracting file buffer and extension from the request
    const inputImagePath = await req.file.buffer;
    console.log(inputImagePath);
    const extension = req.file.originalname.split(".").pop();

    // Define resizing and compression parameters
    const width = 800;
    const compressionQuality = 5;

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

const getAllProduct = async (req, res) => {
  try {
    const product = await productSc
      .find()
      .populate("productType")
      .populate("brand");
    res.json(product);
  } catch (err) {
    return res.status(500).json({ message: "error", error: err.message });
  }
};
const productOnId = async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(productId);
    const product = await productSc
      .findOne({
        _id: productId,
      })
      .populate("productType")
      .populate("brand");

    console.log(product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const createProduct = async (req, res) => {
  const {
    name,
    productType,
    brand,
    description,
    price,
    details,
    attributes,
    isCustomizable,
    shipping_cost,
    is_shipping_cost_need,
    is_cash_on_delivery_avail,
    unit_price,
    purchase_price,
    Variation_Type,
    variation,
    has_expiry,
    is_expiry_expiry_salable,
    unit,
    is_utsab_product,
    utsab_discount,
    inventory: { sku, item_code, quantity },
  } = req.body;

  const imgUrl = getImageLink();

  const { color, size, strength } = attributes;
  console.log(req.body);
  try {
    const newProduct = new productSc({
      name,
      productType,
      brand,
      quantity,
      item_code,
      price,
      description,
      imgUrl,
      details,
      attributes: { color, size, strength },
      isCustomizable,
      shipping_cost,
      is_shipping_cost_need,
      is_cash_on_delivery_avail,
      unit_price,
      purchase_price,
      Variation_Type,
      variation,
      has_expiry,
      is_expiry_expiry_salable,
      unit,
      is_utsab_product,
      utsab_discount,
      inventory: {
        sku,
        item_code,
        quantity,
      },
    });
    console.log(newProduct);
    newProduct
      .save()
      .then((savedProduct) => {
        res.status(201).json({
          success: true,
          message: "Product created successfully",
          product: newProduct,
        });
      })
      .catch((err) => {
        console.error("Error saving product:", err);
        res
          .status(500)
          .json({ message: "Internal Server Error", error: err.message });
      });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.meaasge + " Internal Server Error" });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    console.log(req.file)
    const logoUrl =await getImageLink(req);
    console.log(logoUrl);
    const newBrand = new Brand({
      name,
      description,
      logoUrl,
    });
    console.log(newBrand);

    await newBrand.save();

    return res.status(201).json({
      success: true,
      message: "Brand created successfully",
      brand: newBrand,
    });
  } catch (error) {
    console.error("Error creating brand:", error);

    const errorMessage = error.message || "Internal Server Error";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

module.exports = createBrand;

const categoryDetails = async (req, res) => {
  try {
    const categories = await mainCategory.find().lean().exec();

    const detailCategories = await Promise.all(
      categories.map(async (category) => {
        const subCategories = await subCategory
          .find({ id: category.id })
          .lean()
          .exec();

        const populatedSubCategories = await Promise.all(
          subCategories.map(async (subCategory) => {
            const productTypes = await productType
              .find({ id: subCategory.id })
              .lean()
              .exec();
            return {
              ...subCategory,
              productTypes,
            };
          })
        );

        return {
          ...category,
          subCategories: populatedSubCategories,
        };
      })
    );

    res.json(detailCategories);
  } catch (error) {
    console.error("Error fetching category details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const logoUrl = getImageLink();
    const newCategory = new mainCategory({
      name,
      description,
      logoUrl,
    });
    if (!newCategory) {
      res.status(500).json({ message: "Internal Server Error" });
    }
    await newCategory.save();
    res.status(201).json({
      success: true,
      message: "Category created successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const createSubCategory = async (req, res) => {
  try {
    const { name, description, mainCategoryId } = req.body;
    const mainCategoryDetails = await mainCategory.find({
      _id: mainCategoryId,
    });
    if (!mainCategoryDetails) {
      return res.status(500).json({ message: "Main category is not present" });
    }
    const logoUrl = getImageLink();
    const newSubCategory = new subCategory({
      name,
      description,
      logoUrl,
      mainCategory: mainCategoryId,
    });
    if (!newSubCategory) {
      res.status(500).json({ message: "Internal Server Error" });
    }
    await newSubCategory.save();
    res.status(201).json({
      success: true,
      message: "subCategory created successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const createProductType = async (req, res) => {
  try {
    const { name, description, subCategoryId } = req.body;
    const logoUrl = getImageLink();
    const newSubCategory = new productType({
      name,
      description,
      logoUrl,
      subCategory: subCategoryId,
    });
    if (!newSubCategory) {
      res.status(500).json({ message: "Internal Server Error" });
    }
    await newSubCategory.save();
    res.status(201).json({
      success: true,
      message: "subCategory created successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

const createCustomSearch = async (req, res) => {
  try {
    const newProductSearch = new ProductSearch({
      subCategoryId: req.body.subCategoryId,
      searchResult: req.body.searchResult,
    });
    await newProductSearch.save();
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getSearchResult = async (req, res) => {
  try {
    const searchDetails = await ProductSearch.find({
      subCategoryId: req.param.subCategoryId,
    });
    res.send(searchDetails);
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

const getProductBasisOfSubcategory = async (req, res) => {
  try {
    const subCategoryName = req.query.subCategoryName;
    const subCategoryRecord = await subCategory.findOne({
      name: subCategoryName,
    });
    if (!subCategoryRecord) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    const subCategoryId = subCategoryRecord._id.toString();
    const id = subCategoryId;
    const productTypeList = await productType.find({ subCategory: id });
    const productList = await Promise.all(
      productTypeList.map(async (productType) => {
        return await productSc.findOne({ productType: productType._id });
      })
    );

    res.status(200).json({ productList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const editCategory = async (req, res) => {
  try {
    const categoryDetails = await mainCategory.findOne({
      _id: req.body._id,
    });
    if (!categoryDetails) {
      return res.status(500).json({ message: " No such Category" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const updateProduct = async (req, res) => {
  const {
    name,
    productType,
    brand,
    description,
    price,
    details,
    attributes,
    isCustomizable,
    shipping_cost,
    is_shipping_cost_need,
    is_cash_on_delivery_avail,
    unit_price,
    purchase_price,
    Variation_Type,
    variation,
    has_expiry,
    is_expiry_expiry_salable,
    unit,
    is_utsab_product,
    utsab_discount,
    inventory: { sku, item_code, quantity },
  } = req.body;

  const productId = req.params.id;

  try {
    const existingProduct = await productSc.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const imgUrl = req.file
      ? await getImageLink(req, res)
      : existingProduct.imgUrl;

    const { color, size, strength } = attributes;

    existingProduct.name = name || existingProduct.name;
    existingProduct.productType = productType || existingProduct.productType;
    existingProduct.brand = brand || existingProduct.brand;
    existingProduct.quantity = quantity || existingProduct.quantity;
    existingProduct.item_code = item_code || existingProduct.item_code;
    existingProduct.price = price || existingProduct.price;
    existingProduct.description = description || existingProduct.description;
    existingProduct.imgUrl = imgUrl;
    existingProduct.details = details || existingProduct.details;
    existingProduct.attributes = {
      color: color || existingProduct.attributes.color,
      size: size || existingProduct.attributes.size,
      strength: strength || existingProduct.attributes.strength,
    };
    existingProduct.isCustomizable =
      isCustomizable !== undefined
        ? isCustomizable
        : existingProduct.isCustomizable;
    existingProduct.shipping_cost =
      shipping_cost || existingProduct.shipping_cost;
    existingProduct.is_shipping_cost_need =
      is_shipping_cost_need !== undefined
        ? is_shipping_cost_need
        : existingProduct.is_shipping_cost_need;
    existingProduct.is_cash_on_delivery_avail =
      is_cash_on_delivery_avail !== undefined
        ? is_cash_on_delivery_avail
        : existingProduct.is_cash_on_delivery_avail;
    existingProduct.unit_price = unit_price || existingProduct.unit_price;
    existingProduct.purchase_price =
      purchase_price || existingProduct.purchase_price;
    existingProduct.Variation_Type =
      Variation_Type || existingProduct.Variation_Type;
    existingProduct.variation = variation || existingProduct.variation;
    existingProduct.has_expiry =
      has_expiry !== undefined ? has_expiry : existingProduct.has_expiry;
    existingProduct.is_expiry_expiry_salable =
      is_expiry_expiry_salable !== undefined
        ? is_expiry_expiry_salable
        : existingProduct.is_expiry_expiry_salable;
    existingProduct.unit = unit || existingProduct.unit;
    existingProduct.is_utsab_product =
      is_utsab_product !== undefined
        ? is_utsab_product
        : existingProduct.is_utsab_product;
    existingProduct.utsab_discount =
      utsab_discount || existingProduct.utsab_discount;
    existingProduct.inventory = {
      sku: sku || existingProduct.inventory.sku,
      item_code: item_code || existingProduct.inventory.item_code,
      quantity: quantity || existingProduct.inventory.quantity,
    };

    const updatedProduct = await existingProduct.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const editSubCategory = async (req, res) => {
  try {
    const subCategoryDetails = await subCategory.findOne({
      _id: req.body.subCategoryId,
    });
    if (!subCategoryDetails) {
      return res.status(500).json({ message: "No such subcategory found" });
    }
    const { name, description, mainCategoryId } = req.body();
    subCategoryDetails.name = name;
    subCategoryDetails.description = description;
    subCategoryDetails.categoryId = mainCategoryId;
    await subCategoryDetails.save();
    return res.status(200).json({ message: "Subcategory found successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const editProductType = async (req, res) => {
  try {
    const productTypeDetails = await productType.findOne({
      _id: req.body.productTypeId,
    });
    if (!productTypeDetails) {
      return res.status(500).json({ message: "No such productType found" });
    }
    const { name, description, subCategoryId } = req.body();
    productTypeDetails.name = name;
    productTypeDetails.description = description;
    productTypeDetails.subCategory = subCategoryId;
    await productTypeDetails.save();
    return res.status(200).json({ message: "productType saved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const editBrand = async (req, res) => {
  try {
    const brandId=req.params.brandId
    const brandDetails = await Brand.findOne({
      _id: brandId,
    });
    if (!brandDetails) {
      return res.status(500).json({ message: "No such productType found" });
    }
    console.log(req.file)
    
    if (!req.file) {
      const logoUrl = req.body.logo;
      const { name, description, subCategoryId } = req.body;
      brandDetails.name = name;
      brandDetails.description = description;
      brandDetails.subCategoryId = subCategoryId;
      brandDetails.logoUrl = logoUrl;
      await brandDetails.save();
    }else{
      const logoUrl = await getImageLink(req);
      const { name, description, subCategoryId } = req.body;
      brandDetails.name = name;
      brandDetails.description = description;
      brandDetails.subCategoryId = subCategoryId;
      brandDetails.logoUrl = logoUrl;
      await brandDetails.save();
    }
     
    return res.status(200).json({ message: "productType saved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const productDetails = product.findByIdAndDelete({
      _id: productId,
    });
    if (productDetails) {
      return res.status(500).json({ message: " not Deleted successfully" });
    }
    return res.status(500).json({ message: " Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getProductTypeBasedOnSubCategory = async (req, res) => {
  try {
    const subCategoryId = req.params.subCategoryId;
    const productTypeList = await productType.find({
      subCategory: subCategoryId,
    });
    if(!productTypeList){
      return res.status(500).json({ message: "No list found" });
    }
    return res.status(200).json({ productTypeList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getSubcategoryBasedOnCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const subCategoryList = await subCategory.find({
      mainCategory: categoryId,
    });
    if (!subCategoryList) {
      return res.status(500).json({ message: "No list found" });
    }
    return res.status(200).json({ subCategoryList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getCategoryDetails = async (req, res) => {
  try {
    const mainCategoryList=await mainCategory.find();
    if(!mainCategoryList){
      return res
        .status(500)
        .json({ message: "No list found" });
    }
    return res.status(200).json({ mainCategoryList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getBrand=async(req,res)=>{
  try {
    const brandList=await Brand.find()
    if(!brandList){
      return res
        .status(500)
        .json({ message: "Brandlist is not present" });
    }
    return res.status(200).json({ brandList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
}
const totalProductOfBrand=async(req,res)=>{
  try {
    const brandId=req.params.brandId;
    const totalProduct=await Product.find({
      brand:brandId
    })
    if(!totalProduct){
      return res
        .status(500)
        .json({ message: "No product" });
    }
    return res.status(200).json({ "No of Product":totalProduct.length });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
}
const getBrandById=async(req,res)=>{
  try {
    const brandId=req.params.brandId
    const brandDetails=await Brand.findById({
      _id:brandId
    })
    console.log(brandDetails);
    if (!brandDetails) {
      return res.status(500).json({ message: "No brand found" });
    }
    return res.status(200).json({ brandDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
}
const deleteBrand=async(req,res)=>{
  try {
    const brandId = req.params.brandId;
    const brandDetails = await Brand.findByIdAndDelete({
      _id: brandId,
    });
    if (!brandDetails) {
      return res.status(500).json({ message: " Internal Server Error" });
    }
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
}
const deleteCategory=async(req,res)=>{
  try{
    const categoryId = req.params.categoryId
    const categoryDetails = await mainCategory.findById({
      _id: categoryId,
    });
    if(!categoryDetails){
      return res
        .status(500)
        .json({ message: "no details found" });
    }
     return res.status(500).json({ message: "Deleted successfully" });
  }catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
}
const deleteSubCategory=async(req,res)=>{
  try{
    const subCategoryId = req.params.categoryId;
    const subCategoryDetails = await subCategory.findById({
      _id: subCategoryId,
    });
    if (!subCategoryDetails) {
      return res.status(500).json({ message: "no details found" });
    }
     return res.status(500).json({ message: "Deleted successfully" });
  }catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
}
const deleteProductType=async(req,res)=>{
  try{
    const productTypeId = req.params.categoryId;
    const productTypeDetails = await productType.findById({
      _id: productTypeId,
    });
    if (!productTypeDetails) {
      return res.status(500).json({ message: "no details found" });
    }
     return res.status(500).json({ message: "Deleted successfully" });
  }catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
}
const getCategoryId = async (req, res) => {
  try {
    const productTypeId = req.params.categoryId;
    const productTypeDetails = await productType.findById({
      _id: productTypeId,
    });
    if (!productTypeDetails) {
      return res.status(500).json({ message: "no details found" });
    }
    return res.status(500).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getProductTypeById = async (req, res) => {
  try {
    const productTypeId = req.params.categoryId;
    const productTypeDetails = await productType.findById({
      _id: productTypeId,
    });
    if (!productTypeDetails) {
      return res.status(500).json({ message: "no details found" });
    }
    return res.status(500).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getSubCategoryId = async (req, res) => {
  try {
    const productTypeId = req.params.categoryId;
    const productTypeDetails = await productType.findById({
      _id: productTypeId,
    });
    if (!productTypeDetails) {
      return res.status(500).json({ message: "no details found" });
    }
    return res.status(500).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

module.exports = {
  getAllProduct,
  categoryDetails,
  createCategory,
  createSubCategory,
  createProductType,
  createProduct,
  createBrand,
  productOnId,
  createCustomSearch,
  getSearchResult,
  getProductBasisOfSubcategory,
  editCategory,
  updateProduct,
  editSubCategory,
  editProductType,
  editBrand,
  deleteProduct,
  getProductTypeBasedOnSubCategory,
  getSubcategoryBasedOnCategory,
  getCategoryDetails,
  getBrand,
  totalProductOfBrand,
  getBrandById,
  deleteBrand,
  deleteCategory,
  deleteSubCategory,
  deleteProductType,
  getCategoryId,
  getSubCategoryId,
  getProductTypeById,
};
