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
//http://laptop-uptfb6dh:8000/search/
//https://finafid-search-engine-b5dc68ef0eb1.herokuapp.com/search/
const axios = require("axios");
const Variant = require("../../models/product/Varient");
const searchEngineLink = process.env.searchEngineLink;
// const getSearchDataFirst = async (req, res) => {
//   try {
//     const response = await axios.post(
//       "https://finafid-search-engine-b5dc68ef0eb1.herokuapp.com/search/",
//       {
//         query: req.query.query,
//       }
//     );
//     let stringList=[]

//     if (response.data.message){
//       return res.status(400).json({ message: response.data.message});;
//     }
//     for (let element of response.data.results) {
//       console.log(element.Product);
//       stringList.push(element.Product);

//     }
//      return res.status(200).json(stringList);
//   } catch (error) {
//     res.status(500).json({ message: error.message + " Internal Server Error" });
//   }
// };
// const getSearchDataSecond = async (req, res) => {
//   try {
//     const {
//       sortBy,
//       minPrice,
//       maxPrice,
//       discount,
//       rating,
//       page = 1, // Default to the first page
//       limit = 10, // Default to 10 items per page
//     } = req.query;

//     const response = await axios.post(
//       "https://finafid-search-engine-b5dc68ef0eb1.herokuapp.com/search/",
//       {
//         query: req.query.query,
//       }
//     );
//      if (response.data.message) {
//        return res.status(400).json({ message: response.data.message });
//      }
//     let variantList = [];
//     console.log(response.data);
//     for (let element of response.data.results) {
//       const productDetails = await productSc
//         .findOne({
//           name: element.Product,
//         })
//         .populate({
//           path: "variants",
//           populate: {
//             path: "productGroup",
//             model: "Product",
//           },
//         });

//       variantList = variantList.concat(productDetails.variants);
//     }

//     // Apply Price filter
    // if (maxPrice || minPrice) {
    //   variantList = variantList.filter((variant) => {
    //     const price = variant.sellingPrice;
    //     if (minPrice && price < parseFloat(minPrice)) return false;
    //     if (maxPrice && price > parseFloat(maxPrice)) return false;
    //     return true;
    //   });
    // }

    // // Apply Discount filter
    // if (discount) {
    //   const discountArray = discount.split(",").map(Number);
    //   const maxDiscount = Math.max(...discountArray);
    //   variantList = variantList.filter(
    //     (variant) => variant.discount >= 0 && variant.discount <= maxDiscount
    //   );
    // }

    // // Apply Rating filter
    // if (rating) {
    //   const ratingArray = rating.split(",").map(Number);
    //   const minRating = Math.min(...ratingArray);
    //   variantList = await Promise.all(
    //     variantList.map(async (variant) => {
    //       const review = await ReviewAndRatings.findOne({
    //         productId: variant.productGroup._id,
    //         rating: { $gte: minRating },
    //       });
    //       if (review) return variant;
    //     })
    //   );

    //   variantList = variantList.filter((variant) => variant !== undefined);
    // }

    // // Apply Sorting
    // if (sortBy) {
    //   let sortQuery = {};

    //   if (sortBy === "price asc") sortQuery = { key: "sellingPrice", order: 1 };
    //   if (sortBy === "price desc")
    //     sortQuery = { key: "sellingPrice", order: -1 };
    //   if (sortBy === "discount") sortQuery = { key: "discount", order: -1 };
    //   // if (sortBy === "customerRatings asc")
    //   //   sortQuery = { key: "customerRatings", order: 1 };
    //   // if (sortBy === "customerRatings desc")
    //   //   sortQuery = { key: "customerRatings", order: -1 };

    //   variantList = variantList.sort((a, b) => {
    //     return (a[sortQuery.key] - b[sortQuery.key]) * sortQuery.order;
    //   });
    // }

    // // Pagination
    // const totalItems = variantList.length;
    // variantList = variantList.slice((page - 1) * limit, page * limit);

//     return res.status(200).json({
//       page: parseInt(page),
//       limit: parseInt(limit),
//       totalItems: totalItems,
//       variants: variantList,
//     });
//   } catch (error) {
//     console.error("Error filtering variants:", error);
//     res.status(500).json({ message: error.message + " Internal Server Error" });
//   }
// };
const { productSearch } = require("../../models/product/productSearchSchema");

const productSearchDirectory = async (req, res) => {
  try {
    const productDetails = await productSc.find();

    const [categories, subcategories, productTypes, brands] = await Promise.all(
      [
        mainCategory.find({
          _id: { $in: productDetails.map((p) => p.categoryId) },
        }),
        subCategory.find({
          _id: { $in: productDetails.map((p) => p.subCategoryId) },
        }),
        productType.find({
          _id: { $in: productDetails.map((p) => p.productTypeId) },
        }),
        Brand.find({ _id: { $in: productDetails.map((p) => p.brand) } }),
      ]
    );

    const upsertPromises = productDetails.map(async (product) => {
      await upsertEntity(product._id, product.name, "Product");

      const category = categories.find((cat) =>
        cat._id.equals(product.categoryId)
      );
      if (category) await upsertEntity(category._id, category.name, "Category");

      const subcategory = subcategories.find((sub) =>
        sub._id.equals(product.subCategoryId)
      );
      if (subcategory)
        await upsertEntity(subcategory._id, subcategory.name, "SubCategory");

      const pType = productTypes.find((pt) =>
        pt._id.equals(product.productTypeId)
      );
      if (pType) await upsertEntity(pType._id, pType.name, "ProductType");

      const brand = brands.find((br) => br._id.equals(product.brand));
      if (brand) await upsertEntity(brand._id, brand.name, "Brand");
    });

    await Promise.all(upsertPromises);

    return res.status(200).json({ message: "Entities saved successfully." });
  } catch (error) {
    console.error("Error saving entities:", error);
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};

const upsertEntity = async (entityId, entityName, modelName) => {
  await productSearch.findOneAndUpdate(
    { entityId, modelName },
    { entityId, entityName, modelName },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getSearchDataFirst = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query string is required." });
    }
    const regexQuery = new RegExp(query, "i"); 
    const results = await productSearch
      .find({
        entityName: regexQuery,
      })
      .distinct("entityName");

    if (results.length === 0) {
      return res.status(404).json({ message: "No matching entities found." });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching for entities:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};


const getSearchDataSecond = async (req, res) => {
  try {
    const { query } = req.query;
    const {
      sortBy,
      minPrice,
      maxPrice,
      discount,
      rating,
      page = 1,
      limit = 10,
    } = req.query;

    // if (!query) {
    //   return res.status(400).json({ message: "Query string is required." });
    // }

    // Perform a case-insensitive search using a regular expression
     const regexQuery = new RegExp(query, "i");
     const entities = await productSearch
       .find({
         entityName: regexQuery,
       })
       
    if (!entities){
      return res.status(400).json({ message: "Query string is required." });
    }
      if (entities.length === 0) {
        return res.status(404).json({ message: "No matching entities found." });
      }
      console.log(entities);
    let variantList = [];

    // Iterate through the results and fetch details based on modelName
    const results = await Promise.all(
      entities.map(async (entity) => {
        let detailedEntity;

        switch (entity.modelName) {
          case "Product":
            detailedEntity = await productSc
              .findById(entity.entityId)
              .populate({
                path: "variants",
                populate: {
                  path: "productGroup",
                  model: "Product",
                },
                populate: {
                  path: "productGroup.brand",
                  model: "Brand",
                },
              })
              .populate("brand");
            
            variantList = variantList.concat(detailedEntity.variants);
            break;
          case "Category":
            detailedEntity = await productSc
              .findOne({ categoryId: entity.entityId })
              .populate({
                path: "variants",
                populate: {
                  path: "productGroup",
                  model: "Product",
                },
              })
              .populate("brand");;
            // Directly concatenate variants
            variantList = variantList.concat(detailedEntity.variants);
            break;
          case "SubCategory":
            detailedEntity = await productSc
              .findOne({ subCategoryId: entity.entityId })
              .populate({
                path: "variants",
                populate: {
                  path: "productGroup",
                  model: "Product",
                },
              })
              .populate("brand");;
            // Directly concatenate variants
            variantList = variantList.concat(detailedEntity.variants);
            console.log({ SubCategory: detailedEntity });
            break;
          case "ProductType":
            detailedEntity = await productSc
              .findOne({ productTypeId: entity.entityId })
              .populate({
                path: "variants",
                populate: {
                  path: "productGroup",
                  model: "Product",
                },
              })
              .populate("brand");;
            // Directly concatenate variants
            variantList = variantList.concat(detailedEntity.variants);
            break;
          case "Brand":
            detailedEntity = await productSc
              .findOne({ brand: entity.entityId })
              .populate({
                path: "variants",
                populate: {
                  path: "productGroup",
                  model: "Product",
                },
              })
              .populate("brand");;
            // Directly concatenate variants
            variantList = variantList.concat(detailedEntity.variants);
            break;
          default:
            detailedEntity = null;
        }

        return {
          details: detailedEntity,
          variantList,
        };
      })
    );
        if (maxPrice || minPrice) {
          variantList = variantList.filter((variant) => {
            const price = variant.sellingPrice;
            if (minPrice && price < parseFloat(minPrice)) return false;
            if (maxPrice && price > parseFloat(maxPrice)) return false;
            return true;
          });
        }

        // Apply Discount filter
        if (discount) {
          const discountArray = discount.split(",").map(Number);
          const maxDiscount = Math.max(...discountArray);
          variantList = variantList.filter(
            (variant) =>
              variant.discount >= 0 && variant.discount <= maxDiscount
          );
        }

        // Apply Rating filter
        if (rating) {
          const ratingArray = rating.split(",").map(Number);
          const minRating = Math.min(...ratingArray);
          variantList = await Promise.all(
            variantList.map(async (variant) => {
              const review = await ReviewAndRatings.findOne({
                productId: variant.productGroup._id,
                rating: { $gte: minRating },
              });
              if (review) return variant;
            })
          );

          variantList = variantList.filter((variant) => variant !== undefined);
        }

        // Apply Sorting
        if (sortBy) {
          let sortQuery = {};

          if (sortBy === "price asc")
            sortQuery = { key: "sellingPrice", order: 1 };
          if (sortBy === "price desc")
            sortQuery = { key: "sellingPrice", order: -1 };
          if (sortBy === "discount") sortQuery = { key: "discount", order: -1 };
          // if (sortBy === "customerRatings asc")
          //   sortQuery = { key: "customerRatings", order: 1 };
          // if (sortBy === "customerRatings desc")
          //   sortQuery = { key: "customerRatings", order: -1 };

          variantList = variantList.sort((a, b) => {
            return (a[sortQuery.key] - b[sortQuery.key]) * sortQuery.order;
          });
        }

        // Pagination
        const totalItems = variantList.length;
        variantList = variantList.slice((page - 1) * limit, page * limit);
    res.json({
      page,
      limit,
      totalItems: entities.length,
      variants: variantList,
    });
  } catch (error) {
    console.error("Error searching and iterating entities:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request." });
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
  productSearchDirectory,
  //searchEntityByName,
  //searchAndIterate,
};
