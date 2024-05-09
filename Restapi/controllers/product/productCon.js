const mainCategory = require('../../models/product/mainCatagory')
const subCategory = require('../../models/product/SubCategory')
const productType = require('../../models/product/productType')
const productSc = require('../../models/product/productSc')
const Brand = require('../../models/brand/brandSc')
const ProductSearch = require('../../models/product/productSearchSchema')
const multer = require('multer')
const { genarateStringOfImageList ,compressAndResizeImage} = require('../../utils/fileUpload')
const { model } = require('mongoose')
const sharp = require("sharp");

const getAllProduct = async (req, res) => {
    try {
        const product = await productSc.find();
        res.json(product);
    } catch (err) {
        return res.status(500).json({ message: 'error', error: err.message });
    }
}
const productOnId = async (req, res) => {
    try {
        const productId = req.params.productId;
        console.log(productId)
        const product = await productSc.findOne({
            _id: productId
        }).populate("brand","name");
        console.log(product)
        if (!product) {

            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
const createProduct = async (req, res) => {
    const { name, productType, brand, quantity, description, price, imgUrl, details, attributes, isCustomizable } = req.body

    // const storage = multer.memoryStorage();
    // const upload = multer({ storage: storage });
    // await genarateStringOfImageList(req.file.buffer, req.file.originalname, req.file.mimetype)
    const item_code = brand.substring(0, 3) + name.substring(0, 3) + name.length;
    const { color, size, strength } = attributes
    console.log(req.body)
    try {
        const newProduct = new productSc({
            name, productType, brand, quantity, item_code, price, description, imgUrl, details, attributes: { color, size, strength }, isCustomizable
        })
        console.log(newProduct)
        newProduct.save()
            .then(savedProduct => {
                res.status(201).json({
                    success: true,
                    message: 'Product created successfully',
                    product: newProduct
                });
            })
            .catch(err => {
                console.error("Error saving product:", err);
                res.status(500).json({ message: 'Internal Server Error', error: err.message });
            });

    } catch (error) {
        return res.status(500).json({ message: error.meaasge + ' Internal Server Error' });
    }
}

const createBrand = async (req, res) => {
    try {
        const { name, description, logo } = req.body;


        const newBrand = new Brand({
            name,
            description,
            logo
        });

        await newBrand.save();

        return res.status(201).json({
            success: true,
            message: 'Brand created successfully',
            brand: newBrand
        });
    } catch (error) {

        console.error('Error creating brand:', error);

        const errorMessage = error.message || 'Internal Server Error';

        return res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
};

module.exports = createBrand;

const categoryDetails = async (req, res) => {
    try {

        const categories = await mainCategory.find().lean().exec();


        const detailCategories = await Promise.all(categories.map(async (category) => {

            const subCategories = await subCategory.find({ id: category.id }).lean().exec();


            const populatedSubCategories = await Promise.all(subCategories.map(async (subCategory) => {
                const productTypes = await productType.find({ id: subCategory.id }).lean().exec();
                return {
                    ...subCategory,
                    productTypes
                };
            }));


            return {
                ...category,
                subCategories: populatedSubCategories
            };
        }));


        res.json(detailCategories);
    } catch (error) {
        console.error('Error fetching category details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
const createCategory = async (req, res) => {
    try {
        const { name, description, img } = req.body;
        const newCategory = new mainCategory({
            name,
            description,
            img
        })
        if (!newCategory) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
        await newCategory.save();
        res.status(201).json({
            success: true,
            message: 'Category created successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
}
const createSubCategory = async (req, res) => {
    try {
        const { name, description, img, mainCategoryId } = req.body
        const mainCatagoryDetails = await mainCategory.find({ _id: mainCategoryId })
        if (!mainCatagoryDetails) {
            res.status(500).json({ message: 'Main category is not present' });
        }
        const newSubCategory = new subCategory({
            name,
            description,
            img,
            mainCategory: mainCategoryId
        })
        if (!newSubCategory) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
        await newSubCategory.save();
        res.status(201).json({
            success: true,
            message: 'subCategory created successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
}
const createProductType = async (req, res) => {
    try {
        const { name, description, img, subCategoryId } = req.body
        const newSubCategory = new productType({
            name,
            description,
            img,
            subCategory: subCategoryId
        })
        if (!newSubCategory) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
        await newSubCategory.save();
        res.status(201).json({
            success: true,
            message: 'subCategory created successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
}


const createCustemSearch = async (req, res) => {
    try {

        const newProductSearch = new ProductSearch({
            subCategoryId: req.body.subCategoryId,
            searchResult: req.body.searchResult
        })
        await newProductSearch.save();
    } catch (error) {
        res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
}
const getSearchResult = async (req, res) => {
    try {
        const searchDetails = await ProductSearch.find({
            subCategoryId: req.param.subCategoryId
        })
        res.send(searchDetails);

    } catch (error) {
        res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
}
const uploadFiles1 = async (req, res) => {
    try {
        const inputImagePath = req.file.buffer;
        const width = 800; 
        const compressionQuality = 5;
        const extention=req.file.originalname.split(".")[1]
        console.log(extention)
        console.log(req.file)
        const imageBuffer =await compressAndResizeImage(inputImagePath,extention,width,compressionQuality)
        console.log(imageBuffer)
        req.file.originalname = req.file.originalname.split(".")[0].split(" ").join("-") + "-" + Date.now()+(".")+extention;
        console.log(req.file,'Req File')
        genarateStringOfImageList(imageBuffer, req.file.originalname, res)
    }
    catch (error) {
        res.status(500).json({ message: error.message + ' Internal Server Error' });
    }
}
module.exports = {
    getAllProduct,
    categoryDetails,
    createCategory,
    createSubCategory,
    createProductType,
    createProduct,
    createBrand,
    productOnId,
    createCustemSearch,
    getSearchResult,
    uploadFiles1
}
