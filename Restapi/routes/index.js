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
getProductTypeById
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
const { upload } = require("../utils/fileUpload");
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

//user Authentication
routs.post("/register", userRegistrationValidation, userRegistration);
routs.post("/login", userLoginValidation, userLogin);
routs.post("/refresh_token", auth, getRefreshToken);
// routs.get('/mailVarification',mailVarification);
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
routs.post("/createCategory", upload.single("avatar"), createCategory);
routs.post("/createSubCategory", upload.single("avatar"), createSubCategory);
routs.post("/createProductType", upload.single("avatar"), createProductType);
routs.post("/createProduct", upload.single("avatar"), createProduct);
routs.post("/createBrand",upload.single("logo"), createBrand);
routs.get("/getProductById/:productId", productOnId);
routs.get("/getProductBasisOfSubcategory", getProductBasisOfSubcategory);
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
routs.post("/editCategory/:categoryId", editCategory);
routs.post("/updateProduct", updateProduct);
routs.post("/editSubCategory/:subCategoryId", editSubCategory);
routs.post("/editProductType/:productTypeId", editProductType);
routs.post("/editBrand/:brandId",upload.single("logo"), editBrand);
routs.get("/deleteProduct", deleteProduct);
routs.get("/deleteCategory", deleteCategory);
routs.get("/deleteSubCategory", deleteSubCategory);
routs.get("/deleteProductType", deleteProductType);
routs.get("/getCategoryId/:categoryId", getCategoryId);
routs.get("/getSubCategoryId/:subcategoryId", getSubCategoryId);
routs.get("/getProductTypeById/:productTypeId", getProductTypeById);

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

module.exports = routs;
