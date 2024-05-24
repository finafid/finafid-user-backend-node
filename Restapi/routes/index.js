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
  uploadFiles1,
  getSearchResult,
  getProductBasisOfSubcategory,
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
} = require("../controllers/order/addressControler.js");

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
routs.post("/createCategory", createCategory);
routs.post("/createSubCategory", createSubCategory);
routs.post("/createProductType", createProductType);
routs.post("/createProduct", createProduct);
routs.post("/createBrand", createBrand);
routs.get("/getProductById/:productId", productOnId);
routs.get("/getProductBasisOfSubcategory", getProductBasisOfSubcategory);
routs.get("/getProductsAfterFiltration/:subCategoryId", getSearchResult);
routs.get("/getProductsAfterFiltration", getSearchResult);

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
routs.post("/placeOrder", auth, placeOrder);
routs.get("/getOrderDetails", auth, getOrderDetails);
routs.get("/getOrderById/:orderId", auth, getOrderById);
routs.post("/updateStatus", auth, updateStatus);

//Address

routs.post("/addAddress", auth, addAddress);

routs.get("/getAddressOfUser", auth, getAddressOfUser);

//giftCard
routs.post("/createGiftCard", auth, createGiftCard);
routs.get("/getGiftCardDetails/:orderId", auth, getGiftCardDetails);
routs.get("/getGiftCardByUser", auth, getGiftCardByUser);

//test

routs.post("/uploadFiles", upload.single("file"), uploadFiles1);

module.exports = routs;
