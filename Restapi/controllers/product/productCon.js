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
    const inputImagePath = await req.file.buffer;
    const extension = req.file.originalname.split(".").pop();
    const width = 800;
    const compressionQuality = 5;

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

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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
        path: "productTypeId",
      },
    });

    // Shuffle the variants array
    //const shuffledVariants = shuffleArray(variants);

    return res.status(200).json({ variants: variants });
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
      // .populate("productTypeId")
      // .populate("brand")
      .populate("variants");

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
    isExpirySaleable,
    productType,
    brand,
    unit,
    productCode,
    description,
    variationAttributes,
    variation,
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
      isExpirySaleable,
      categoryId: category,
      subCategoryId: subCategory,
      productTypeId: productType,
      brand,
      unit,
      productCode,
      description,
      variation,
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
      const varientName = "" + variantData.sku + name;
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
        discount: variantData.discount,
        shippingCost: variantData.shippingCost,
        utsavDiscount: variantData.utsavDiscount,
        minOrderQuantity: variantData.minOrderQuantity,
        discountType: variantData.discountType,
        hasShippingCost: variantData.hasShippingCost,
        taxPercent: variantData.taxPercent,
        sellingPrice: variantData.sellingPrice,
        utsavPrice: variantData.utsavPrice,
        barCode: variantData.barCode,
        utsavReward: variantData.utsavReward,
        basicReward: variantData.basicReward,
        utsavDiscountType: variantData.utsavDiscountType,
        name: varientName,
      });

      await variant.save();
      newProduct.variants.push(variant._id);
      await newProduct.save();
    }

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
const updateVariants = async (req, res) => {
  try {
    const variantId = req.params.variantId;
    const variantDetails = await Variant.findById(variantId);
    if (!variantDetails) {
      return res.status(500).json({ message: "Variant not found" });
    }

    // Get the old quantity before updating the variant
    const oldQuantity = parseInt(variantDetails.quantity, 10);

    let newList = [];
    if (req.body.images) {
      newList = req.body.images;
      if (req.files && req.files["images[]"]) {
        const variantImageLinks = await getImageLinks(req.files["images[]"]);
        newList = req.body.images.concat(variantImageLinks);
      }
    } else if (req.files && req.files["images[]"]) {
      newList = await getImageLinks(req.files["images[]"]);
    }
    const productGroupDetails = await productSc.findById(req.body.productId);
    console.log(req.body.images);
    console.log(req.body);
    const varientName= "" + req.body.sku + productGroupDetails.name;
    variantDetails.productGroup = req.body.productId;
    variantDetails.attributes = req.body.attributes;
    variantDetails.sku = req.body.sku;
    variantDetails.quantity = parseInt(req.body.quantity, 10);
    variantDetails.taxModel = req.body.taxModel;
    variantDetails.isUtsav = req.body.isUtsav || false;
    variantDetails.unitPrice = parseFloat(req.body.unitPrice);
    variantDetails.purchasePrice = parseFloat(req.body.purchasePrice);
    variantDetails.cod = req.body.cod || false;
    variantDetails.images = newList;
    variantDetails.discount = parseFloat(req.body.discount);
    variantDetails.shippingCost = parseFloat(req.body.shippingCost);
    variantDetails.utsavDiscount = parseFloat(req.body.utsavDiscount);
    variantDetails.minOrderQuantity = parseInt(req.body.minOrderQuantity, 10);
    variantDetails.discountType = req.body.discountType;
    variantDetails.hasShippingCost = req.body.hasShippingCost;
    variantDetails.taxPercent = parseFloat(req.body.taxPercent);
    variantDetails.sellingPrice = parseFloat(req.body.sellingPrice);
    variantDetails.utsavPrice = parseFloat(req.body.utsavPrice);
    variantDetails.barCode = parseFloat(req.body.barCode);
    variantDetails.utsavReward = parseFloat(req.body.utsavReward);
    variantDetails.basicReward = parseFloat(req.body.basicReward);
    variantDetails.utsavDiscountType = req.body.utsavDiscountType;
    variantDetails.name =varientName
    // Save variant details
    await variantDetails.save();

    const productDetails = await Product.findById(req.body.productId);
    if (!productDetails) {
      return res.status(500).json({ message: "Product not found" });
    }

    // Update product total quantity
    const newQuantity = parseInt(req.body.quantity, 10);
    productDetails.totalQuantity =
      parseInt(productDetails.totalQuantity, 10) + (newQuantity - oldQuantity);

    console.log(productDetails.totalQuantity);

    await productDetails.save();

    return res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Error updating variant:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = updateVariants;

const addVariants = async (req, res) => {
  try {
    const productGroupDetails = await productSc.findById(req.body.productId);
    const variantImageLinks = await getImageLinks(req.files["images[]"]);
     const varientName= "" + req.body.sku + productGroupDetails.name;
    const variant = new Variant({
      name:varientName,
      productGroup: req.body.productId,
      attributes: req.body.attributes,
      sku: req.body.sku,
      quantity: parseInt(req.body.quantity),
      taxModel: req.body.taxModel,
      isUtsav: req.body.isUtsav || false,
      unitPrice: req.body.unitPrice,
      purchasePrice: req.body.purchasePrice,
      cod: req.body.cod || false,
      images: variantImageLinks,
      discount: req.body.discount,
      shippingCost: req.body.shippingCost,
      utsavDiscount: req.body.utsavDiscount,
      minOrderQuantity: req.body.minOrderQuantity,
      discountType: req.body.discountType,
      // hasShippingCost: req.body.hasShippingCost,
      taxPercent: req.body.taxPercent,
      sellingPrice: parseFloat(req.body.sellingPrice),
      utsabPrice: parseFloat(req.body.utsavPrice),
      barCode: req.body.barCode,
      utsavReward: parseFloat(req.body.utsavReward),
      basicReward: parseFloat(req.body.basicReward),
      utsavDiscountType: req.body.utsavDiscountType,
    });
    if (!variant) {
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
    const productDetails = await Product.findById({
      _id: req.body.productId,
    });
    if (!productDetails) {
      return res.status(500).json({ message: "No such product" });
    }
    productDetails.variants.push(variant._id);
    productDetails.variation = req.body.variation;
    productDetails.totalQuantity =
      parseInt(productDetails.totalQuantity) + parseInt(req.body.quantity);
    console.log(productDetails.totalQuantity);
    await productDetails.save();

    await variant.save();
    return res.status(200).json({ message: "Saved successfully" });
  } catch (error) {
    console.error("Error saving product:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
const deleteVariants = async (req, res) => {
  try {
    const variantId = req.params.variantId;
    const variantDetail = await Variant.findByIdAndDelete(variantId);
    
    if (!variantDetail) {
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
    const productDetails = await Product.findById({
      _id: variantDetail.productGroup,
    });
    if (productDetails.variants.length == 0) {
      await Product.findByIdAndDelete({
        _id: variantDetail.productGroup,
      });
    }
    return res.status(200).json({ message: "Delete successfully" });
  } catch (error) {
    console.error("Error saving product:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
const getVariantById = async (req, res) => {
  try {
    const variantId = req.params.variantId;
    const variantDetails = await Variant.findById({
      _id: variantId,
    }).populate("productGroup");

    if (!variantDetails) {
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
    return res.status(200).json({
      success: true,
      variantDetails,
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
const createBrand = async (req, res) => {
  try {
    const { name, description, categoryList } = req.body;
    const logoUrl = await getImageLink(req);
    const newBrand = new Brand({
      name,
      description,
      logoUrl,
      categoryList,
    });
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

const categoryDetails = async (req, res) => {
  try {
    const categories = await mainCategory.find().lean().exec();

    const detailCategories = await Promise.all(
      categories.map(async (category) => {
        const subCategories = await subCategory
          .find({ mainCategoryId: category._id })
          .lean()
          .exec();

        const populatedSubCategories = await Promise.all(
          subCategories.map(async (subCategory) => {
            const productTypes = await productType
              .find({ subCategoryId: subCategory._id })
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
    let logoUrl=""
    if(req.file){
         logoUrl = await getImageLink(req);
    }
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

  try {
    const {
      totalQuantity,
      name,
      isCustomizable,
      hasExpiry,
      category,
      subCategory,
      isExpirySaleable,
      productType,
      brand,
      unit,
      productCode,
      description,
      variationAttributes,
      variation,
      variants,
    } = req.body;

    const existingProduct = await Product.findById(req.params.productId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

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
    let singleImageUrl = existingProduct.thumbnail;
    if (uploadedFiles["thumbnail"]) {
      const [imageLink] = await uploadFiles(uploadedFiles["thumbnail"]);
      singleImageUrl = imageLink;
    }

    let newList = [];
    let imageListUrls = req.body.otherImages;
    if (uploadedFiles["otherImages[]"]) {
      newList = await uploadFiles(uploadedFiles["otherImages[]"]);
      if (imageListUrls) {
        newList = newList.concat(imageListUrls);
      }
    } else {
      newList = imageListUrls;
    }
    console.log(existingProduct.otherImages);
    //  let newList = [];
    //  if (req.body.otherImages) {
    //    newList = req.body.otherImages;
    //    if (uploadedFiles["otherImages[]"]) {
    //      imageListUrls = await uploadFiles(uploadedFiles["otherImages[]"]);
    //      newList = req.body.images.concat(imageListUrls);
    //    }
    //  } else {
    //    newList = await uploadFiles(uploadedFiles["otherImages[]"]);
    //  }

    // Update the product details
    existingProduct.totalQuantity = totalQuantity;
    existingProduct.name = name;
    existingProduct.isCustomizable = isCustomizable;
    existingProduct.hasExpiry = hasExpiry;
    existingProduct.isExpirySaleable = isExpirySaleable;
    existingProduct.categoryId = category;
    existingProduct.subCategoryId = subCategory;
    existingProduct.productTypeId = productType;
    existingProduct.brand = brand;
    existingProduct.unit = unit;
    existingProduct.productCode = productCode;
    existingProduct.description = description;
    existingProduct.variation = variation;
    existingProduct.variationAttributes = variationAttributes;
    existingProduct.thumbnail = singleImageUrl;
    existingProduct.otherImages = newList;

    await existingProduct.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: existingProduct,
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
      const { name, description, subCategoryId, categoryList } = req.body;
      brandDetails.name = name;
      brandDetails.description = description;
      brandDetails.subCategoryId = subCategoryId;
      brandDetails.logoUrl = logoUrl;
      brandDetails.categoryList = categoryList;
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
const featuredMainCategory = async (req, res) => {
  try {
    const mainCategoryList = await mainCategory.findById(req.params.categoryId);
    if (!mainCategoryList) {
      return res.status(500).json({ message: "No subCategory" });
    }
    mainCategoryList.is_featured = req.body.featured;
    await mainCategoryList.save();
    return res.status(200).json({ message: "Done" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const featuredSubCategory = async (req, res) => {
  try {
    const details = await subCategory.findById(req.params.categoryId);
    if (!details) {
      return res.status(500).json({ message: "No subCategory" });
    }
    details.is_featured = req.body.featured;
    await details.save();
    return res.status(200).json({ message: "Done" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const featuredBrand = async (req, res) => {
  try {
    const details = await Brand.findById(req.params.categoryId);
    if (!details) {
      return res.status(500).json({ message: "No subCategory" });
    }
    details.is_featured = req.body.featured;
    await details.save();
    return res.status(200).json({ message: "Done" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const featuredProduct = async (req, res) => {
  try {
    const details = await Variant.findOneAndUpdate(
      { _id: req.params.categoryId },
      { is_featured: req.body.featured },
      { new: true }
    );

    if (!details) {
      return res.status(500).json({ message: "No varient" });
    }

    return res.status(200).json({ message: "Done" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const activeProduct = async (req, res) => {
  try {
    const details = await Variant.findOneAndUpdate(
      { _id: req.params.categoryId },
      { is_active: req.body.activeStatus },
      { new: true }
    );
    if (!details) {
      return res.status(500).json({ message: "No varient" });
    }

    return res.status(200).json({ message: "Done" });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllFeaturedBrand = async (req, res) => {
  try {
    const brandDetails = await Brand.find({
      is_featured: true,
    });
    if (!brandDetails) {
      return res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
    return res.status(200).json({ brandDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllFeaturedCategory = async (req, res) => {
  try {
    const categoryDetails = await mainCategory.find({
      is_featured: true,
    });
    if (!categoryDetails) {
      return res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
    return res.status(200).json({ categoryDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllFeaturedSubCategory = async (req, res) => {
  try {
    const subCategoryDetails = await subCategory.find({
      is_featured: true,
    });
    if (!subCategoryDetails) {
      return res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
    return res.status(200).json({ subCategoryDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getAllFeaturedProduct = async (req, res) => {
  try {
    const variantDetails = await Variant.find({
      is_featured: true,
    }).populate({
      path: "productGroup",
      populate: {
        path: "productTypeId", // Nested population
      },
    });
    if (!variantDetails) {
      return res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
    return res.status(200).json({ variantDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const brandBasedOnCategory = async (req, res) => {
  try {
    const brandDetails = await Brand.find({
      categoryList: { $in: [req.params.categoryId] },
    });
    res.status(200).json({ brandDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getFeaturedProductBasedOnCategory = async (req, res) => {
  try {
    const productList = await productSc
      .find({
        categoryId: req.params.categoryId,
      })
      .populate({
        path: "variants",
        model: "Variant",
        populate: {
          path: "productGroup",
          model: "Product",
        },
      });
    const variantList = [];
    productList.forEach((element) => {
      if (Array.isArray(element.variants)) {
        variantList.push(...element.variants);
      } else if (element.variants) {
        variantList.push(element.variants);
      }
    });
    const filteredVariants = variantList.filter(
      (variant) => variant.is_featured === true
    );

    return res.status(200).json({ productList: filteredVariants });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const deleteNonProductVariants = async (req, res) => {
  try {
    
    const variantDetail = await Variant.find();

    if (!variantDetail) {
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }

   for (const element of variantDetail) {
     try {
       const variantDetail = await Variant.findById(element._id);
       const productDetails = await productSc.findById(
         variantDetail.productGroup
       );

       if (!productDetails) {
         await Variant.findByIdAndDelete(element._id);
       }
     } catch (error) {
       console.error(
         `Failed to process variant with ID ${element._id}:`,
         error
       );
     }
   }
    return res.status(200).json(variantDetail);
  } catch (error) {
    console.error("Error saving product:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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
  updateVariants,
  addVariants,
  deleteVariants,
  getVariantById,
  featuredMainCategory,
  featuredSubCategory,
  featuredBrand,
  featuredProduct,
  getAllFeaturedBrand,
  getAllFeaturedCategory,
  getAllFeaturedSubCategory,
  getAllFeaturedProduct,
  activeProduct,
  brandBasedOnCategory,
  getFeaturedProductBasedOnCategory,
  deleteNonProductVariants,
};
