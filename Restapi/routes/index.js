const express=require('express');
const { userLogin, userRegistration,mailVarification,sendMailVarification,varifyOtp,updatePasswordForResetPassword,logout,userDetails,
    getRefreshToken,sendMailVerificationForForgotPassword} = require('../controllers/auth');
const { userRegistrationValidation ,userLoginValidation,emailVarification,otpVarification,passwordVarification} = require('../middlewares/userValidation');
const routs=express.Router();
const {getAllProduct,categoryDetails,createCategory,
    createSubCategory,createProductType,createProduct,createBrand,productOnId,createCustemSearch,
    getSearchResult}=require('../controllers/product/productCon')
const {addToWishlist,getTheWishlist,deleteFromWishlist,addToCart,getTheCart,deleteFromCart}=require('../controllers/cart&wishlist/cartWlController') 
const { placeOrder,getOrderDetails,getOrderById,updateStatus}=require('../controllers/order/orderController')

const auth=require('../middlewares/Auth')

routs.post('/register',userRegistrationValidation,userRegistration);
routs.post('/login',userLoginValidation,userLogin);
routs.post('/refresh_token',auth,getRefreshToken)
// routs.get('/mailVarification',mailVarification);
routs.post('/send_mail_Varification',emailVarification,sendMailVarification);
routs.post('/otp_varification',varifyOtp)

//Forgot password 
routs.post('/sendMailForUpdatePassword',emailVarification,sendMailVerificationForForgotPassword);
routs.post('/updatePassword',passwordVarification,updatePasswordForResetPassword);

//Logout api
routs.get('/logout',auth,logout)
//user Details
routs.get('/userDetails',auth,userDetails)

// Product Details

routs.get('/allProducts',auth,getAllProduct)
routs.get('/allCategoryDetails',categoryDetails)
routs.post('/createCategory',createCategory)
routs.post('/createSubCategory',createSubCategory)
routs.post('/createProductType',createProductType)
routs.post('/createProduct',createProduct)
routs.post('/createBrand',createBrand)
routs.get('/getProductById',productOnId)
routs.get('/getProductsAfterFiltration/:subCategoryId',getSearchResult)
routs.get('/getProductsAfterFiltration',getSearchResult)


//Wishlist
routs.post('/addToWishlist',auth,addToWishlist)
routs.get('/getTheWishlist',auth,getTheWishlist)
routs.post('/deleteFromWishlist',auth,deleteFromWishlist)

//Cart
routs.post('/addToCart',auth,addToCart)
routs.get('/getTheCart',auth,getTheCart)
routs.post('/deleteFromCart',auth,deleteFromCart)

//order
routs.post('/placeOrder',auth,placeOrder);
routs.get('/getOrderDetails',auth,getOrderDetails)
routs.get('/getOrderById/:orderId',auth,getOrderById)
routs.post('/updateStatus',auth,updateStatus)




module.exports=routs;