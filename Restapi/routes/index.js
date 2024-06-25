const express = require("express");
const {
  userLogin,
  userRegistration,
  mailVarification,
  sendMailVarification,
  varifyOtp,
  updatePasswordForResetPassword,
  logout,
  userDetails,
  getRefreshToken,
  sendMailVerificationForForgotPassword,
  updateUserDetails,
} = require("../controllers/auth");
const {
  userRegistrationValidation,
  userLoginValidation,
  emailVarification,
  otpVarification,
  passwordVarification,
} = require("../middlewares/userValidation");
const routs = express.Router();
const {
  getAllProduct,
  categoryDetails,
  createCategory,
  createSubCategory,
  createProductType,
  createProduct,
  createBrand,
  productOnId,
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
} = require("../controllers/product/productCon");
const {
  addToWishlist,
  getTheWishlist,
  deleteFromWishlist,
  addToCart,
  getTheCart,
  deleteFromCart,
  clearCart,
} = require("../controllers/cart&wishlist/cartWlController");
const {
  placeOrder,
  getOrderDetails,
  getOrderById,
  updateStatus,
} = require("../controllers/order/orderController");
const { upload, uploadImageToS3 } = require("../utils/fileUpload");
const {
  createGiftCard,
  getGiftCardDetails,
  getGiftCardByUser,
} = require("../controllers/GiftCard/giftCardController");
const auth = require("../middlewares/Auth");
const {
  addAddress,
  getAddressOfUser,
  updateAddressOfUser,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/order/addressControler");
const {
  paymentDetails,
  verifySignature,
} = require("../controllers/Payment/paymentController.js");

const { apiKeyMiddleware } = require("../middlewares/apikey.js");
const {
  addBalance,
  showTransactions,
} = require("../controllers/Wallet/walletController.js");
const {
  totalIncome,
  totalOrder,
  productSold,
  totalUser,
  orderAnalysis,
  incomeAnalysis,
  getUserOrderCount,
  topSellingProduct,
} = require("../controllers/Admin Dashboard/dashBoardController.js");
const {
  deleteVariationType,
  editVariationType,
  createVariation,
  getAllVariation,
} = require("../controllers/product/variation&UnitController.js");
const {
  adminRegistration,
  adminLogin,
  sendMailVerificationAdmin,
  verifyOtp,
  adminDetails,
  updateAdminDetails,
} = require("../controllers/auth _admin/authAdmin.js");


//user Authentication
routs.post("/register", userRegistrationValidation, userRegistration);
routs.post("/login", userLoginValidation, userLogin);
routs.post("/refresh_token", auth, getRefreshToken);
routs.post("/send_mail_Varification", emailVarification, sendMailVarification);
routs.post("/otp_varification", varifyOtp);

//Forgot password
routs.post(
  "/sendMailForUpdatePassword",
  emailVarification,
  sendMailVerificationForForgotPassword
);
routs.post(
  "/updatePassword",
  passwordVarification,
  updatePasswordForResetPassword
);

//Logout api
routs.get("/logout", auth, logout);
//user Details
routs.get("/userDetails", auth, userDetails);
routs.post(
  "/updateUserDetails",
  auth,
  upload.single("avatar"),
  updateUserDetails
);

// Product Details

routs.get("/allProducts", getAllProduct);
routs.get("/allCategoryDetails", categoryDetails);
routs.post("/createCategory", upload.single("logo"), createCategory);
routs.post("/createSubCategory", upload.single("logo"), createSubCategory);
routs.post("/createProductType", upload.single("logo"), createProductType);

routs.post("/createBrand", upload.single("logo"), createBrand);
routs.get("/getProductById/:productId", productOnId);
routs.get(
  "/getProductBasisOfSubcategory/:subCategoryId",
  getProductBasisOfSubcategory
);
routs.get("/getProductsAfterFiltration/:subCategoryId", getSearchResult);
routs.get("/getProductsAfterFiltration", getSearchResult);
routs.get("/getAllCategory", getCategoryDetails);
routs.get(
  "/getProductTypeBasedOnSubCategory/:subCategoryId",
  getProductTypeBasedOnSubCategory
);
routs.get(
  "/getSubcategoryBasedOnCategory/:categoryId",
  getSubcategoryBasedOnCategory
);

routs.get("/getBrand", getBrand);
routs.get("/getBrandById/:brandId", getBrandById);
routs.get("/deleteBrand/:brandId", deleteBrand);
routs.get("/totalProductOfBrand/:brandId", totalProductOfBrand);
routs.post("/editCategory/:categoryId", upload.single("logo"), editCategory);
routs.post("/updateProduct", upload.single("logo"), updateProduct);
routs.post(
  "/editSubCategory/:subCategoryId",
  upload.single("logo"),
  editSubCategory
);
routs.post(
  "/editProductType/:productTypeId",
  upload.single("logo"),
  editProductType
);
routs.post("/editBrand/:brandId", upload.single("logo"), editBrand);
routs.get("/getProductById/:productId", productOnId);
routs.post("/updateProduct", uploadImageToS3, updateProduct);
routs.post(
  "/createProduct",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "otherImages", maxCount: 10 },
    { name: "images", maxCount: 10 },
  ]),
  createProduct
);
routs.get("/deleteProduct", deleteProduct);
routs.get("/deleteCategory/:categoryId", deleteCategory);
routs.get("/deleteSubCategory/:subCategoryId", deleteSubCategory);
routs.get("/deleteProductType/:productTypeId", deleteProductType);
routs.get("/getCategoryId/:categoryId", getCategoryId);
routs.get("/getSubCategoryId/:subcategoryId", getSubCategoryId);
routs.post(
  "/editSubCategory/:subCategoryId",
  upload.single("logo"),
  editSubCategory
);
routs.get("/getProductTypeById/:productTypeId", getProductTypeById);
routs.post("/createProductType", upload.single("logo"), createProductType);
routs.get("/getAllSubCategory", getAllSubCategory);
routs.get("/getAllProductType", getAllProductType);

//Wishlist
routs.post("/addToWishlist", auth, addToWishlist);
routs.get("/getWishlistItems", auth, getTheWishlist);
routs.post("/deleteFromWishlist", auth, deleteFromWishlist);

//Cart
routs.post("/addToCart", auth, addToCart);
routs.get("/getCartItems", auth, getTheCart);
routs.post("/deleteFromCart", auth, deleteFromCart);
routs.get("/clearCart", auth, clearCart);

//order
routs.post("/placeOrder", auth, apiKeyMiddleware, placeOrder);
routs.get("/getOrderDetails", auth, getOrderDetails);
routs.get("/getOrderById/:orderId", auth, getOrderById);
routs.post("/updateStatus", auth, updateStatus);

//Address

routs.post("/addAddress", auth, addAddress);

routs.get("/getAddressOfUser", auth, getAddressOfUser);
routs.post("/updateAddressOfUser", auth, updateAddressOfUser);

routs.post("/deleteAddress", auth, deleteAddress);
routs.post("/setDefaultAddress", auth, setDefaultAddress);
//payment
routs.post("/create-order", paymentDetails);
routs.post("/verify-payment", verifySignature);

//giftCard
routs.post("/createGiftCard", auth, createGiftCard);
routs.get("/getGiftCardDetails/:orderId", auth, getGiftCardDetails);
routs.get("/getGiftCardByUser", auth, getGiftCardByUser);

//wallet
routs.post("/addBalance", auth, addBalance);
routs.get("/showTransactions", auth, showTransactions);

//admin dashboard
routs.get("/getTotalIncome", totalIncome);
routs.get("/getTotalOrder", totalOrder);
routs.get("/getProductSold", productSold);
routs.get("/getTotalUser", totalUser);
routs.get("/getOrderAnalysis", orderAnalysis);
routs.get("/getUserOrderCount", getUserOrderCount);
routs.get("/topSellingProduct", topSellingProduct);
//variation
routs.post("/createVariation", createVariation);
routs.post("/deleteVariationType", deleteVariationType);
routs.get("/editVariationType", editVariationType);
routs.get("/getAllVariation", getAllVariation);

//admin auth
routs.post("/register", userRegistrationValidation, adminRegistration);
routs.post("/login", userLoginValidation, adminLogin);
routs.post("/refresh_token", auth, sendMailVerificationAdmin);
routs.post(
  "/send_mail_Varification",
  emailVarification,
  sendMailVerificationAdmin
);
routs.post("/otp_verification", verifyOtp);
routs.post("/adminDetails", auth, adminDetails);
routs.post("/updateAdminDetails", auth, updateAdminDetails);

//Forgot password
//// Create a new review
routs.post("/createReview", auth, createReview); 
routs.get("/GetAllReviews/:productId", auth, GetAllReviews); 
routs.get("/reviewByID/:productId/:reviewId", auth, reviewByID); 
routs.post("/updateReview/:productId/:reviewId", auth, updateReview); 
routs.post("/deleteReview", auth, deleteReview); 
{
createReview, GetAllReviews, reviewByID, updateReview, deleteReview;
}

module.exports = routs;
