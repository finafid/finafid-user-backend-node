const mainCategory = require("../../models/product/mainCatagory");
const subCategory = require("../../models/product/SubCategory");
const productType = require("../../models/product/productType");
const productSc = require("../../models/product/productSc");
const Brand = require("../../models/brand/brandSc");
const ProductSearch = require("../../models/product/productSearchSchema");
const Variant = require("../../models/product/Varient.js");
const {
  generateStringOfImageList,
  compressAndResizeImage,
  getImageLinks,
  uploadFiles,
} = require("../../utils/fileUpload");
const Product = require("../../models/product/productSc");
const getImageLink = async (req, res) => {
  try {
    // Extracting file buffer and extension from the request
    const inputImagePath = await req.file.buffer;

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
      .populate("productTypeId")
      .populate("brand")
      .populate({
        path: "variants",
      });
    res.json(product);
  } catch (err) {
    return res.status(500).json({ message: "error", error: err.message });
  }
};
const getAllVarients = async (req, res) => {
  try {
      const variants = await Variant.find().populate({
        path: "productGroup",
        populate: {
          path: "productTypeId", // Nested population
        },
      });
      
      
    res.json(variants);
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
    totalQuantity,
    name,
    isCustomizable,
    hasExpiry,
    category,
    subCategory,
    productType,
    brand,
    unit,
    barCode,
    description,
    variationAttributes,
    variants,
  } = req.body;
  console.log("THE REQUEST.FILES IS:", req.files);

  try {
    // Initialize an object to store uploaded URLs
    const uploadedFiles = {};

    // Process all files and categorize by fieldname
    for (const file of req.files) {
      const fieldName = file.fieldname;
      if (!uploadedFiles[fieldName]) {
        uploadedFiles[fieldName] = [];
      }
      uploadedFiles[fieldName].push(file);
    }

    // Upload thumbnail image
    let singleImageUrl = "";
    if (uploadedFiles["thumbnail"]) {
      const [imageLink] = await uploadFiles(uploadedFiles["thumbnail"]);
      singleImageUrl = imageLink;
    }

    // Upload other images
    let imageListUrls = [];
    if (uploadedFiles["otherImages[]"]) {
      imageListUrls = await uploadFiles(uploadedFiles["otherImages[]"]);
    }

    // Create the product
    const newProduct = new Product({
      totalQuantity,
      name,
      isCustomizable,
      hasExpiry,
      categoryId: category,
      subCategoryId: subCategory,
      productTypeId: productType,
      brand,
      unit,
      barCode,
      description,
      variationAttributes,
      thumbnail: singleImageUrl,
      otherImages: imageListUrls,
      variants: [],
    });

    await newProduct.save();

    // Process each variant
    for (let i = 0; i < variants.length; i++) {
      const variantData = variants[i];
      let variantImageLinks = [];

      // Collect variant images
      let count = 0;
      while (uploadedFiles[`variants[${i}][images][${count}]`]) {
        const imageLinks = await uploadFiles(
          uploadedFiles[`variants[${i}][images][${count}]`]
        );
        variantImageLinks = [...variantImageLinks, ...imageLinks];
        count++;
      }

      const variant = new Variant({
        productGroup: newProduct._id,
        attributes: variantData.attributes,
        sku: variantData.sku,
        quantity: variantData.quantity,
        taxModel: variantData.taxModel,
        isUtsav: variantData.isUtsav || false,
        unitPrice: variantData.unitPrice,
        purchasePrice: variantData.purchasePrice,
        cod: variantData.cod || false,
        images: variantImageLinks,
      });

      await variant.save();
      newProduct.variants.push(variant._id);
    }

    await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error saving product:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    console.log(req.file);
    const logoUrl = await getImageLink(req);
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
    console.log(req.file);
    const logoUrl = await getImageLink(req);
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
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No details given" });
    }
    const { name, description, mainCategoryId } = req.body;
    const mainCategoryDetails = await subCategory.find({
      _id: mainCategoryId,
    });
    if (!mainCategoryDetails) {
      return res.status(500).json({ message: "Main category is not present" });
    }
    const logoUrl = await getImageLink(req);
    const newSubCategory = new subCategory({
      name,
      description,
      logoUrl,
      mainCategoryId,
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
    const { name, description, subCategoryId, categoryId } = req.body;
    const logoUrl = await getImageLink(req);
    const newProductType = new productType({
      name,
      description,
      logoUrl,
      subCategoryId,
      categoryId,
    });
    if (!newProductType) {
      res.status(500).json({ message: "Internal Server Error" });
    }
    await newProductType.save();
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
    const subCategoryName = req.params.subCategoryId;
    const subCategoryRecord = await subCategory.findOne({
      _id: subCategoryId,
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
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No details given" });
    }
    const categoryDetails = await mainCategory.findOne({
      _id: req.params.categoryId,
    });
    if (!categoryDetails) {
      return res.status(500).json({ message: " No such Category" });
    }
    console.log(categoryDetails);
    if (!req.file) {
      const logoUrl = req.body.logo;
      console.log(req.body);
      console.log(logoUrl);
      const { name, description } = req.body;
      categoryDetails.name = name;
      categoryDetails.description = description;
      categoryDetails.logoUrl = logoUrl;
      await categoryDetails.save();
    } else {
      const logoUrl = await getImageLink(req);
      const { name, description } = req.body;
      categoryDetails.name = name;
      categoryDetails.description = description;
      categoryDetails.logoUrl = logoUrl;
      await categoryDetails.save();
    }
    return res.status(200).json({ categoryDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
    console.log({ message: error.message });
  }
};
const updateProduct = async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "No details given" });
  }
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
      _id: req.params.subCategoryId,
    });
    if (!subCategoryDetails) {
      return res.status(500).json({ message: "No such subcategory found" });
    }
    console.log(req.body);
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No details given" });
    }

    if (!req.file) {
      const logoUrl = req.body.logo;
      const { name, description, mainCategoryId } = req.body;
      subCategoryDetails.name = name;
      subCategoryDetails.description = description;
      subCategoryDetails.mainCategoryId = mainCategoryId;
      subCategoryDetails.logoUrl = logoUrl;
      await subCategoryDetails.save();
    } else {
      const logoUrl = await getImageLink(req);
      const { name, description, mainCategoryId } = req.body;
      subCategoryDetails.name = name;
      subCategoryDetails.description = description;
      subCategoryDetails.mainCategoryId = mainCategoryId;
      subCategoryDetails.logoUrl = logoUrl;
      await subCategoryDetails.save();
    }
    return res.status(200).json({ subCategoryDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const editProductType = async (req, res) => {
  try {
    const productTypeDetails = await productType.findOne({
      _id: req.params.productTypeId,
    });
    if (!productTypeDetails) {
      return res.status(500).json({ message: "No such productType found" });
    }
    if (!req.file) {
      const logoUrl = req.body.logo;
      const { name, description, subCategoryId, categoryId } = req.body;
      productTypeDetails.name = name;
      productTypeDetails.description = description;
      productTypeDetails.subCategoryId = subCategoryId;
      productTypeDetails.categoryId = categoryId;
      productTypeDetails.logoUrl = logoUrl;
      await productTypeDetails.save();
    } else {
      const logoUrl = await getImageLink(req);
      const { name, description, subCategoryId, categoryId } = req.body;
      productTypeDetails.name = name;
      productTypeDetails.description = description;
      productTypeDetails.subCategoryId = subCategoryId;
      productTypeDetails.logoUrl = logoUrl;
      await productTypeDetails.save();
    }
    return res.status(200).json({ productTypeDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const editBrand = async (req, res) => {
  try {
    const brandId = req.params.brandId;
    const brandDetails = await Brand.findOne({
      _id: brandId,
    });
    if (!brandDetails) {
      return res.status(500).json({ message: "No such productType found" });
    }
    console.log(req.file);

    if (!req.file) {
      const logoUrl = req.body.logo;
      const { name, description, subCategoryId } = req.body;
      brandDetails.name = name;
      brandDetails.description = description;
      brandDetails.subCategoryId = subCategoryId;
      brandDetails.logoUrl = logoUrl;
      await brandDetails.save();
    } else {
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
      subCategoryId: subCategoryId,
    });
    if (!productTypeList) {
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
      mainCategoryId: categoryId,
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
    const mainCategoryList = await mainCategory.find();
    if (!mainCategoryList) {
      return res.status(500).json({ message: "No list found" });
    }
    return res.status(200).json({ mainCategoryList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getBrand = async (req, res) => {
  try {
    const brandList = await Brand.find();
    if (!brandList) {
      return res.status(500).json({ message: "Brandlist is not present" });
    }
    return res.status(200).json({ brandList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const totalProductOfBrand = async (req, res) => {
  try {
    const brandId = req.params.brandId;
    const totalProduct = await Product.find({
      brand: brandId,
    });
    if (!totalProduct) {
      return res.status(500).json({ message: "No product" });
    }
    return res.status(200).json({ "No of Product": totalProduct.length });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getBrandById = async (req, res) => {
  try {
    const brandId = req.params.brandId;
    const brandDetails = await Brand.findById({
      _id: brandId,
    });
    console.log(brandDetails);
    if (!brandDetails) {
      return res.status(500).json({ message: "No brand found" });
    }
    return res.status(200).json({ brandDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const deleteBrand = async (req, res) => {
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
};
const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const categoryDetails = await mainCategory.findByIdAndDelete({
      _id: categoryId,
    });
    if (!categoryDetails) {
      return res.status(500).json({ message: "no details found" });
    }
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const deleteSubCategory = async (req, res) => {
  try {
    const subCategoryId = req.params.subCategoryId;
    console.log(subCategoryId);
    const subCategoryDetails = await subCategory.findByIdAndDelete({
      _id: subCategoryId,
    });
    if (!subCategoryDetails) {
      return res.status(500).json({ message: "no details found" });
    }
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const deleteProductType = async (req, res) => {
  try {
    const productTypeId = req.params.productTypeId;
    const productTypeDetails = await productType.findByIdAndDelete({
      _id: productTypeId,
    });
    if (!productTypeDetails) {
      return res.status(500).json({ message: "no details found" });
    }
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getCategoryId = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const categoryDetails = await mainCategory.findById({
      _id: categoryId,
    });
    if (!categoryDetails) {
      return res.status(500).json({ message: "No details found" });
    }
    return res.status(200).json({ categoryDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getProductTypeById = async (req, res) => {
  try {
    const productTypeId = req.params.productTypeId;
    const productTypeDetails = await productType.findById({
      _id: productTypeId,
    });
    if (!productTypeDetails) {
      return res.status(500).json({ message: "no details found" });
    }
    return res.status(200).json({ productTypeDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getSubCategoryId = async (req, res) => {
  try {
    const subCategoryId = req.params.subcategoryId;
    const subCategoryIdDetails = await subCategory.findById({
      _id: subCategoryId,
    });
    if (!subCategoryIdDetails) {
      return res.status(500).json({ message: "no details found" });
    }
    return res.status(200).json({ subCategoryIdDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllSubCategory = async (req, res) => {
  try {
    const subCategoryList = await subCategory.find({});
    if (!subCategoryList) {
      return res.status(500).json({ message: "No subCategory" });
    }
    return res.status(200).json({ subCategoryList });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllProductType = async (req, res) => {
  try {
    const productTypeList = await productType.find({});
    if (!productTypeList) {
      return res.status(500).json({ message: "No subCategory" });
    }
    return res.status(200).json({ productTypeList });
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
  getAllSubCategory,
  getAllProductType,
  getAllVarients,
};
