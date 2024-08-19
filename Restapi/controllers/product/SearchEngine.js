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

    for (const product of productDetails) {
      // Check if the product entity already exists
      let existingEntry = await productSearch.findOne({
        entityId: product._id,
        modelName: "Product",
      });
      if (!existingEntry) {
        // Store product in Entity schema
        const productEntry = new productSearch({
          entityId: product._id,
          entityName: product.name,
          modelName: "Product",
        });
        await productEntry.save();
      }

      // Check if the main category entity already exists
      const category = await mainCategory.findById(product.categoryId);
      if (category) {
        existingEntry = await productSearch.findOne({
          entityId: category._id,
          modelName: "Category",
        });
        if (!existingEntry) {
          const categoryEntry = new productSearch({
            entityId: category._id,
            entityName: category.name,
            modelName: "Category",
          });
          await categoryEntry.save();
        }
      }

      // Check if the subcategory entity already exists
      const subcategory = await subCategory.findById(product.subCategoryId);
      if (subcategory) {
        existingEntry = await productSearch.findOne({
          entityId: subcategory._id,
          modelName: "SubCategory",
        });
        if (!existingEntry) {
          const subCategoryEntry = new productSearch({
            entityId: subcategory._id,
            entityName: subcategory.name,
            modelName: "SubCategory",
          });
          await subCategoryEntry.save();
        }
      }

      // Check if the product type entity already exists
      const pType = await productType.findById(product.productTypeId);
      if (pType) {
        existingEntry = await productSearch.findOne({
          entityId: pType._id,
          modelName: "ProductType",
        });
        if (!existingEntry) {
          const productTypeEntry = new productSearch({
            entityId: pType._id,
            entityName: pType.name,
            modelName: "ProductType",
          });
          await productTypeEntry.save();
        }
      }

      // Check if the brand entity already exists
      const brand = await Brand.findById(product.brandId);
      if (brand) {
        existingEntry = await productSearch.findOne({
          entityId: brand._id,
          modelName: "Brand",
        });
        if (!existingEntry) {
          const brandEntry = new productSearch({
            entityId: brand._id,
            entityName: brand.name,
            modelName: "Brand",
          });
          await brandEntry.save();
        }
      }
    }

    return res.status(200).json({ message: "Entities saved successfully." });
  } catch (error) {
    console.error("Error saving entities:", error);
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

const getSearchDataFirst = async (req, res) => {
  try {
    const { query } = req.query;

    // if (!query) {
    //   return res.status(400).json({ message: "Query string is required." });
    // }

    // Perform a case-insensitive search using a regular expression
    const results = await productSearch.find({
      entityName: { $regex: `^${query}`, $options: "i" }, // 'i' for case-insensitive search
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No matching entities found." });
    }
    const stringList = [];
    results.forEach((element) => {
      stringList.push(element.entityName);
    });
    res.status(200).json(stringList);
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
    const entities = await productSearch.find({
      entityName: { $regex: `${query}`, $options: "i" }, // 'i' for case-insensitive search
    });

    if (entities.length === 0) {
      return res.status(404).json({ message: "No matching entities found." });
    }

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
              });
            // Directly concatenate variants
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
              });
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
              });
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
              });
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
              });
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
