const mainCategory = require("../../models/product/mainCatagory");
const subCategory = require("../../models/product/SubCategory");
const productType = require("../../models/product/productType");
const productSc = require("../../models/product/productSc");
const Brand = require("../../models/brand/brandSc");
const { productSearch } = require("../../models/product/productSearchSchema");
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
    const compressionQuality = 0;

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
    if (!product) {
      return res.status(500).json({ message: "No product " });
    }
    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({ message: "error", error: err.message });
  }
};
const getAllVarients = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    // Pagination settings
    const currentPage = Math.max(parseInt(page, 10), 1);
    const perPage = Math.max(parseInt(limit, 10), 1);
    const skip = (currentPage - 1) * perPage;

    // Fetch variants with pagination and populate related fields
    let variants = await Variant.find()
      .skip(skip)
      .limit(perPage)
      .populate({
        path: "productGroup",
        populate: {
          path: "productTypeId",
        },
      });

    // Apply search query if provided
    if (query) {
      const regexQuery = new RegExp(query.split("").join(".*"), "i");
      variants = variants.filter((element) => regexQuery.test(element.name));
      if (variants.length === 0) {
        return res.status(404).json({ message: "No matching entities found." });
      }
    }

    // Fetch total count of variants
    const totalCount = await Variant.countDocuments();

    // Return response with paginated data and total count
    return res.status(200).json({
      variants,
      page: currentPage,
      limit: perPage,
      total: totalCount,
    });
  } catch (err) {
    return res.status(500).json({ message: "Error", error: err.message });
  }
};

const productOnId = async (req, res) => {
  try {
    const productId = req.params.productId;
    // console.log({ productId: req.params.productId });
    const product = await productSc
      .findOne({
        _id: productId,
      })
      // .populate("productTypeId")
      // .populate("brand")
      .populate("variants")
      .populate("brand");

    // console.log(product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const uploadVariants = async (
  variants,
  uploadedFiles,
  productId,
  productName
) => {
  const variantPromises = variants.map(async (variantData, i) => {
    let variantImageLinks = [];
    console.log(variantData);

    // Initialize count for each variant's images
    let count = 0;

    // Loop through uploaded variant images
    while (uploadedFiles[`variants[${i}][images][${count}]`]) {
      const imageLinks = await uploadFiles(
        uploadedFiles[`variants[${i}][images][${count}]`]
      );
      variantImageLinks = [...variantImageLinks, ...imageLinks];
      count++;
    }

    let singleImageUrl = "";
    const colorImageKey = `variants[${i}][colorImage]`;
    console.log(colorImageKey);

    // Upload color image if it exists
    if (uploadedFiles[colorImageKey]) {
      const [imageLink] = await uploadFiles(uploadedFiles[colorImageKey]);
      singleImageUrl = imageLink;
    }
    console.log(singleImageUrl);

    // Create the variant
    const variant = new Variant({
      productGroup: productId,
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
      name: variantData.name,
      variantDetails: variantData.variantDetails,
      expiryDate: variantData.expiryDate,
      colorImage: singleImageUrl,
    });

    await variant.save();
    return variant._id;
  });

  // Wait for all variants to be saved
  return await Promise.all(variantPromises);
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
    hasColorShade,
    productType,
    brand,
    unit,
    productCode,
    description,
    variationAttributes,
    variation,
    variants = [], // Default to an empty array to avoid undefined errors
  } = req.body;

  try {
    // Initialize an object to store uploaded URLs
    const uploadedFiles = {};
    console.log(req.files);

    // Process all files and categorize by fieldname
    for (const file of req.files || []) {
      // Avoid errors if req.files is undefined
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
      const uploadedUrls = await uploadFiles(uploadedFiles["otherImages[]"]);
      imageListUrls = uploadedUrls.flat();
    }

    // Create the product
    const newProduct = new Product({
      totalQuantity,
      name,
      isCustomizable,
      hasExpiry,
      isExpirySaleable,
      hasColorShade,
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
      is_active: true,
    });

    await newProduct.save();

    // Upload variants if they exist
    if (variants.length > 0) {
      const variantIds = await uploadVariants(
        variants,
        uploadedFiles,
        newProduct._id,
        name
      );
      newProduct.variants.push(...variantIds);
      await newProduct.save();
    }

    return res.status(200).json({
      success: true,
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const updateVariants = async (req, res) => {
  try {
    const variantId = req.params.variantId;

    // Find the existing variant by ID
    const variantDetail = await Variant.findById(variantId);
    if (!variantDetail) {
      return res.status(404).json({ message: "Variant not found" });
    }

    // Get the current quantity before the update
    const oldQuantity = parseInt(variantDetail.quantity, 10);

    // Initialize a new list for images
    let newList = req.body.images ? [...req.body.images] : [];

    // Check if files are provided and if the key "images[]" exists
    if (req.files && req.files["images[]"]) {
      try {
        const variantImageLinks = await getImageLinks(req.files["images[]"]);
        newList = newList.concat(variantImageLinks);
      } catch (imageError) {
        console.error("Error processing images:", imageError);
        return res.status(500).json({
          message: "Error processing images",
          error: imageError.message,
        });
      }
    }

    // Check if the product group exists
    const productGroupDetails = await productSc.findById(req.body.productId);
    if (!productGroupDetails) {
      return res.status(404).json({ message: "Product group not found" });
    }

    // Update variant fields
    variantDetail.productGroup = req.body.productId;
    variantDetail.attributes = req.body.attributes;
    variantDetail.sku = req.body.sku;
    variantDetail.quantity = parseInt(req.body.quantity, 10);
    variantDetail.taxModel = req.body.taxModel;
    variantDetail.isUtsav = req.body.isUtsav || false;
    variantDetail.unitPrice = parseFloat(req.body.unitPrice);
    variantDetail.purchasePrice = parseFloat(req.body.purchasePrice);
    variantDetail.cod = req.body.cod || false;
    variantDetail.images = newList;
    variantDetail.discount = parseFloat(req.body.discount);
    variantDetail.shippingCost = parseFloat(req.body.shippingCost);
    variantDetail.utsavDiscount = parseFloat(req.body.utsavDiscount);
    variantDetail.minOrderQuantity = parseInt(req.body.minOrderQuantity, 10);
    variantDetail.discountType = req.body.discountType;
    variantDetail.hasShippingCost = req.body.hasShippingCost;
    variantDetail.taxPercent = parseFloat(req.body.taxPercent);
    variantDetail.sellingPrice = parseFloat(req.body.sellingPrice);
    variantDetail.utsavPrice = parseFloat(req.body.utsavPrice);
    variantDetail.barCode = parseFloat(req.body.barCode);
    variantDetail.utsavReward = parseFloat(req.body.utsavReward);
    variantDetail.basicReward = parseFloat(req.body.basicReward);
    variantDetail.utsavDiscountType = req.body.utsavDiscountType;
    variantDetail.variantDetails = req.body.variantDetails;
    variantDetail.expiryDate = req.body.expiryDate;
    variantDetail.name = req.body.name;

    // Save updated variant details
    await variantDetail.save();

    // Update the total quantity for the associated product
    const productDetails = await Product.findById(req.body.productId);
    if (!productDetails) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newQuantity = parseInt(req.body.quantity, 10);
    productDetails.totalQuantity =
      parseInt(productDetails.totalQuantity, 10) + (newQuantity - oldQuantity);

    console.log("Updated total quantity:", productDetails.totalQuantity);

    await productDetails.save();

    return res.status(200).json({ message: "Variant updated successfully" });
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
    const variant = new Variant({
      name: req.body.name,
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
      variantDetails: req.body.variantDetails,
      expiryDate: req.body.expiryDate,
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
      return res.status(500).json({ message: "No details found" });
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
// getVariantById = async (req, res) => {
//   try {
//     const variantDetails = await Variant.findById(
//       req.params.variantId
//     ).populate("productGroup");

//     if (!variantDetails) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Variant not found" });
//     }

//     const productDetails = await productSc.findById(
//       variantDetails.productGroup
//     );

//     const productList = await productSc
//       .find({
//         productTypeId: productDetails.productTypeId,
//       })
//       .populate({
//         path: "variants",
//         populate: {
//           path: "productGroup",
//           populate: {
//             path: "brand",
//             model: "Brand",
//           },
//         },
//       })
//       .populate("brand");

//     const suggestionProductList = productList.reduce((acc, product) => {
//       return acc.concat(product.variants);
//     }, []);

//     return res.status(200).json({
//       success: true,
//       variantDetails,
//       suggestionProductList,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
const getVariantById = async (req, res) => {
  try {
    const variantDetails = await Variant.findById(
      req.params.variantId
    ).populate("productGroup");
    if (!variantDetails) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }
    return res.status(200).json({
      success: true,
      variantDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const suggestionProductList = async (req, res) => {
  try {
    const variantDetails = await Variant.findById(
      req.params.variantId
    ).populate("productGroup");

    if (!variantDetails) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }
    const [productDetails, productList] = await Promise.all([
      productSc.findById(variantDetails.productGroup),
      productSc
        .find({
          productTypeId: variantDetails.productGroup.productTypeId
        })
        .populate({
          path: "variants",
          populate: {
            path: "productGroup",
            select: "brand",
            populate: {
              path: "brand",
              model: "Brand",
              select: "name",
            },
          },
        })
        .populate("brand", "name"), // Populating only necessary fields
    ]);

    const suggestionProductList = productList.flatMap(
      (product) => product.variants
    );

    return res.status(200).json({
      success: true,
      suggestionProductList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name, description, categoryList, productTypeList } = req.body;
    const logoUrl = await getImageLink(req);
    const newBrand = new Brand({
      name,
      description,
      logoUrl,
      categoryList,
      productTypeList,
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
    const categories = await mainCategory.find({}).lean().exec();

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
    let logoUrl = "";
    if (req.file) {
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
    const { name, description, subCategoryId, categoryId, variationFeatures } =
      req.body;
    const logoUrl = await getImageLink(req);
    const newProductType = new productType({
      name,
      description,
      logoUrl,
      subCategoryId,
      categoryId,
      variationFeatures,
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
const getVariationFeature = async (req, res) => {
  try {
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
    const subCategoryRecord = await productSc
      .find({
        subCategoryId: req.params.subCategoryId,
      })
      .populate("variants");
    if (!subCategoryRecord) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    return res.status(200).json({ subCategoryRecord });
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
      hasColorShade,
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
    existingProduct.hasColorShade = hasColorShade;
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
    console.log(req.params.productTypeId);
    console.log(productTypeDetails);
    console.log(req.body);
    if (!productTypeDetails) {
      return res.status(500).json({ message: "No such productType found" });
    }
    if (!req.file) {
      const logoUrl = req.body.logo;
      const {
        name,
        description,
        subCategoryId,
        categoryId,
        variationFeatures,
      } = req.body;
      productTypeDetails.name = name;
      productTypeDetails.description = description;
      productTypeDetails.subCategoryId = subCategoryId;
      productTypeDetails.categoryId = categoryId;
      productTypeDetails.logoUrl = logoUrl;
      productTypeDetails.variationFeatures = variationFeatures;
      await productTypeDetails.save();
    } else {
      const logoUrl = await getImageLink(req);
      const { name, description, subCategoryId, variationFeatures } = req.body;
      productTypeDetails.name = name;
      productTypeDetails.description = description;
      productTypeDetails.subCategoryId = subCategoryId;
      productTypeDetails.logoUrl = logoUrl;
      productTypeDetails.variationFeatures = variationFeatures;
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
    console.log(req.body);
    if (!req.file) {
      const logoUrl = req.body.logo;
      const {
        name,
        description,
        subCategoryId,
        categoryList,
        productTypeList,
      } = req.body;
      brandDetails.name = name;
      brandDetails.description = description;
      brandDetails.subCategoryId = subCategoryId;
      brandDetails.logoUrl = logoUrl;
      brandDetails.categoryList = categoryList;
      brandDetails.productTypeList = productTypeList;
      await brandDetails.save();
    } else {
      const logoUrl = await getImageLink(req);
      const { name, description, subCategoryId, productTypeList } = req.body;
      brandDetails.name = name;
      brandDetails.description = description;
      brandDetails.subCategoryId = subCategoryId;
      brandDetails.logoUrl = logoUrl;
      brandDetails.productTypeList = productTypeList;
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
    const productTypeList = await productType.find({
      subCategoryId: req.params.subCategoryId,
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
      is_active: true,
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
      return res.status(500).json({ message: "BrandList is not present" });
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
    const brandDetails = await Brand.findById({
      _id: req.params.brandId,
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
    const brandDetails = await Brand.findByIdAndDelete({
      _id: req.params.brandId,
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
    const categoryDetails = await mainCategory.findByIdAndDelete({
      _id: req.params.categoryId,
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
    const subCategoryDetails = await subCategory.findByIdAndDelete({
      _id: req.params.subCategoryId,
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
    const productTypeDetails = await productType.findByIdAndDelete({
      _id: req.params.productTypeId,
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
    const categoryDetails = await mainCategory.findById({
      _id: req.params.categoryId,
    });
    console.log(categoryDetails);
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
    const productTypeDetails = await productType.findById({
      _id: req.params.productTypeId,
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
    const subCategoryIdDetails = await subCategory.findById({
      _id: req.params.subcategoryId,
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
      return res.status(404).json({ message: "Variant not found" });
    }

    if(details?.is_featured){
      return res.status(200).json({ message: "Added To Featured Product", is_featured: details?.is_featured,newArrival:details?.newArrival });
    }else{
      return res.status(200).json({ message: "Removed From Featured Product", is_featured: details?.is_featured,newArrival:details?.newArrival });
    }   
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
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
      return res.status(404).json({ message: "Variant not found" });
    }

    const message = details.is_active
      ? "Product activated successfully"
      : "Product deactivated successfully";

    return res.status(200).json({ message,is_active:details.is_active });
  } catch (error) {
    console.error("Error updating product status:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllFeaturedBrand = async (req, res) => {
  try {
    const brandDetails = await Brand.find({
      is_featured: true,
      is_active: true,
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
      is_active: true,
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
      is_active: true,
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
      populate: {
        path: "brand",
      },
    });
    if (!variantDetails) {
      return res.status(500).json({ message: "No variantDetails" });
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
    return res.status(200).json({ brandDetails });
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
    if (!productList) {
      return res.status(500).json({ message: "No product found" });
    }
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
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
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
const activeBrandById = async (req, res) => {
  try {
    const elementDetails = await Brand.findById(req.params.brandId);
    if (!elementDetails) {
      res.status(400).json({ message: "No element Found" });
    }
    elementDetails.is_active = req.body.activeStatus;
    await elementDetails.save();
    return res.status(200).json({ message: "Updated Successfully" });
  } catch (error) {
    console.error("Error saving product:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
const activeCategoryById = async (req, res) => {
  try {
    const elementDetails = await mainCategory.findById(req.params.categoryId);
    if (!elementDetails) {
      res.status(400).json({ message: "No element Found" });
    }
    elementDetails.is_active = req.body.activeStatus;
    await elementDetails.save();
    return res.status(200).json({ message: "Updated Successfully" });
  } catch (error) {
    console.error("Error saving product:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
const activeSubCategoryById = async (req, res) => {
  try {
    const elementDetails = await subCategory.findById(req.params.subCategoryId);
    if (!elementDetails) {
      res.status(400).json({ message: "No element Found" });
    }
    elementDetails.is_active = req.body.activeStatus;
    await elementDetails.save();
    res.status(200).json({ message: "Updated Successfully" });
  } catch (error) {
    console.error("Error saving product:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
const activeProductTypeById = async (req, res) => {
  try {
    const elementDetails = await productType.findById(req.params.productTypeId);
    if (!elementDetails) {
      res.status(400).json({ message: "No element Found" });
    }
    elementDetails.is_active = req.body.activeStatus;
    await elementDetails.save();
    return res.status(200).json({ message: "Updated Successfully" });
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
  suggestionProductList,
  activeBrandById,
  activeCategoryById,
  activeSubCategoryById,
  activeProductTypeById,
};
