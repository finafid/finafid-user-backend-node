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
  updateEmail,
  updateNotification,
  deleteUserAccount,
  deleteUserAccountFromUser,
  verify_Refresh_Token,
  validAccessToken,
  changePhoneNumber,
  loginUsingPhoneNumber,
  sendOtpToPhone,
  getUserName,
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
} = require("../controllers/product/productCon");
const {
  addToWishlist,
  getTheWishlist,
  deleteFromWishlist,
  addToCart,
  getTheCart,
  validateCartForUtsav,
  deleteFromCart,
  clearCart,
  removeFromCart,
} = require("../controllers/cartAndwishlist/cartWlController.js");
const {
  placeOrder,
  getOrderDetails,
  getOrderById,
  updateStatus,
  getOrderByStatus,
  getAllOrder,
  getSalesPercentageByCategory,
  editOrder,
  orderStatusDetails,
  setDeliveryDate,
  cancelDelivery,
  downloadInvoice,
} = require("../controllers/order/orderController");
const { upload, uploadImageToS3 } = require("../utils/fileUpload");

const {
  getSettings,
  getSettingById,
  createSetting,
  updateSetting,
  deleteSetting,
} = require('../controllers/sections/settingController.js');

const {
  createComponent,
  getAllComponents,
  getComponentById,
  updateComponent,
  deleteComponent,
} = require('../controllers/home/homeCon.js');

const {
  createGiftCard,
  getGiftCardDetails,
  getGiftCardByUser,
  createGiftCardTemplate,
  getAllTemplates,
  deleteTemplate,
  editTemplateId,
  getTemplateId,
  getAllGiftCard,
  redeemGiftCard,
} = require("../controllers/GiftCard/giftCardController");
const auth = require("../middlewares/Auth");
const authad = require("../middlewares/AdminAuth.js");
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
  getBalance,
  addBalanceFromAdmin,
  getBalanceFromAdmin,
  addWallet,
  getTotalBalance
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
} = require("../controllers/product/variationAndUnitController.js");
const {
  adminRegistration,
  adminLogin,
  sendMailVerificationAdmin,
  verifyOtp,
  adminDetails,
  updateAdminDetails,
} = require("../controllers/auth _admin/authAdmin.js");
const {
  createReview,
  GetAllReviews,
  reviewByID,
  updateReview,
  deleteReview,
  getAvgRating,
} = require("../controllers/product/reviewAndRatings.js");
const { authenticate, createOrder } = require("../controllers/order/socket.js");
const {
  createBanner,
  editBanner,
  getBannersByBannerTypeAndDetails,
  deleteBanner,
  publishBanner,
  getAllBanner,
  getAllBannerTypes,
  getBannersWithFilters,
  getBannerById,
} = require("../controllers/BannerController/bannerCon");

const {
  createFlashDeal,
  createFeaturedDeal,
  createDealOfTheDay,
  getAllFlashDeal,
  getAllFeaturedDeals,
  getDealOfTheDay,
  getFlashDealById,
  getFeaturedDealById,
  getDEalOfTheDayById,
  deleteDealOfTheDay,
  deleteFeaturedDeal,
  deleteFlashDeal,
  editDEalOfTheDayById,
  editFeaturedDealById,
  editFlashDealById,
  addProductFlashDeal,
  addProductFeaturedDeal,
  updateStatusFlashDeal,
  updateStatusFeaturedDeal,
  updateStatusDealOfTheDay,
  deleteProductFlashDeal,
  deleteProductFeaturedDeal,
  getAllFlashDealOnUser,
  getAllFeaturedDealsOnUser,
  getDealOfTheDayOnUser,
  getFlashDealByIdOnUser,
  getFeaturedDealByIdOnUser,
  getDEalOfTheDayByIdOnUser,
} = require("../controllers/CouponsAndDeal/DealsControllers.js");

const {
  addRewardPoints,
  showRewardTransactions,
  getRewardBalance,
  addRewardFromAdmin,
  getRewardBalanceFromAdmin,
  addRewardWallet,
  getTotalRewards,
} = require("../controllers/Reward/rewardController.js");




const {
  createCoupons,
  getTheCoupon,
  applyCoupon,
  updateCoupons,
  deleteCoupons,
  getAllCoupons,
  updateStatusCoupons,
  getAllCouponsOnUser,
} = require("../controllers/CouponsAndDeal/CouponsController.js");
const {
  shareReferralCode,
  redeemedReferral,
} = require("../controllers/auth/referralCon");
const {
  createNewDeal,
  getAllDeal,
  getDealById,
  updateDeal,
  deleteDeal,
} = require("../controllers/CouponsAndDeal/GetandBuyDealController.js");

const {
  isUtsabApplicable,
  addMembershipPlan,
  totalOrderOfUtsav,
  addBorrowMember,
  addLeader,
  getLeaderDetails,
  getAllBorrowLIst,
  getAllLeader,
  addBorrowMembershipPlan,
  getAllMemberList,
  totalSpendOfMemberSingle,
  getReferralDetailsSingle,
  getMemberShipPlan,
  getBorrowMemberShipPlan,
  getMemberById,
  getAllWalletTransaction,
  approveBorrowRequest,
  approveLeaderRequest,
  getAllApprovedLeader,
} = require("../controllers/Utsab/UtsabController.js");
const {
  getAllReviews,
} = require("../controllers/Admin_user/User_admin_reviews");
const {
  getAllUser,
  blockingCustomer,
  deleteCustomer,
  getCustomerDetailsById,
  makeUtsabMember,
  customerOrderDetails,
  contactUs,
} = require("../controllers/Admin_user/adminUserCOntroller.js");
const {
  getAllNewArrivals,
  markAsaNewArrivals,
  getAllUtsavFeaturedBrand,
  markAsaUtsavFeaturedBrand,
  createUtsavGallery,
  getAllGallery,
  getGalleryDetailsById,
  deleteGalleryById,
  editGalleryDetails,
  publishGalleryById,
  getAllPublishedGallery,
} = require("../controllers/Utsab/UtsavBannerController.js");
const {
  getAllUtsavProduct,
  getAllUtsavProductBasedOnCategory,
  makeTopSellingProduct,
  getAllTopSellingBrand,
  getAllTopSellingProduct,
  makeProductTypeIsFeatured,
  getAllFeaturedProductType,
  makeTopSellingBrand,
  getProductByName,
} = require("../controllers/product/UtsavProductCon.js");
const {
  sendAppNotification,
} = require("../controllers/Notification/notificationController");
const {
  getAllSearchTypeBasedOnSubCategory,
  getAllSearchTypeBasedOnProductType,
  getAllSearchTypeBasedOnProduct,
  getAllVariantsOnUser,
  getProductTypesBasedOnBrand,
  getBrandsBasedOnProductType,
} = require("../controllers/product/productSearchController.js");
const {
  paymentResponse,
  paymentDetail,
  handlePaymentSuccess,
  handlePaymentFailure,
} = require("../controllers/Payment/PayuPaymentController.js");

const {
  getAllProductInformationBasedOnProduct,
  getSearchDataFirst,
  getSearchDataSecond,
  productSearchDirectory,
  searchEntityByName,
  searchAndIterate,
} = require("../controllers/product/SearchEngine.js");
const {
  googleCallback,
  loginWithGoogle,
} = require("../controllers/auth/GoogleLogin.js");
const {
  createFashionCategory,
  editFashionCategory,
  deleteFashionCategory,
  getFashionCategoryById,
  getBlogsFashionCategoryById,
  getAllFashionCategory,
} = require("../controllers/FashionController/fashionCategoryController.js");
const {
  createBlog,
  editFashionBlog,
  deleteFashionBlog,
  getFashionBlogById,
  getBlogsFashionCategoryUser,
  getAllFashionBlog,
} = require("../controllers/FashionController/FashionBlogController.js");
const {
  messageForUtsavMember,
  messageForOrderDelivary,
  messageForOrderOnTheWay,
  messageForOrderConfirmed,
} = require("../controllers/Message/message.js");
const {
  handleWebhook,
} = require("../controllers/webhooks/webhookController.js");
//user Authentication
routs.post("/register", userRegistrationValidation, userRegistration);
routs.post("/login", userLoginValidation, userLogin);
routs.post("/refresh_token", auth, getRefreshToken);
routs.post("/send_mail_Varification", emailVarification, sendMailVarification);
routs.post("/otp_varification", varifyOtp);
routs.get("/deleteUserAccount/:userId", deleteUserAccount);
routs.get("/deleteUserAccountFromUser", auth, deleteUserAccountFromUser);
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
routs.post("/payu-webhook", handleWebhook);
routs.post("/updateEmail", auth, updateEmail);
routs.post("/updateNotification", auth, updateNotification);
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
routs.post("/verifyRefreshToken", verify_Refresh_Token);
routs.post("/validAccessToken", validAccessToken);
routs.get("/changePhoneNumber", changePhoneNumber);
routs.get("/getUserName", getUserName);
// Product Details

routs.get("/allProducts", getAllProduct);
routs.get("/allCategoryDetails", categoryDetails);
routs.post("/createCategory", upload.single("logo"), auth, createCategory);
routs.post(
  "/createSubCategory",
  upload.single("logo"),
  auth,
  createSubCategory
);
routs.post(
  "/createProductType",
  upload.single("logo"),
  auth,
  createProductType
);
routs.get("/getAllVariants",authad, getAllVarients);
routs.post("/createBrand", upload.single("logo"), auth, createBrand);
routs.get("/getProductGroupById/:productId", productOnId);
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
routs.post("/editBrand/:brandId", upload.single("logo"), auth, editBrand);
routs.get("/getProductById/:productId", productOnId);
routs.post("/updateProduct/:productId", upload.any(), updateProduct);
routs.post("/createProduct", upload.any(), auth, createProduct);
routs.get("/deleteProduct", auth, deleteProduct);
routs.get("/deleteCategory/:categoryId", auth, deleteCategory);
routs.get("/deleteSubCategory/:subCategoryId", auth, deleteSubCategory);
routs.get("/deleteProductType/:productTypeId", auth, deleteProductType);
routs.get("/getCategoryId/:categoryId", getCategoryId);
routs.get("/getSubCategoryId/:subcategoryId", getSubCategoryId);
routs.get("/suggestionProductList/:variantId", suggestionProductList);
routs.post(
  "/editSubCategory/:subCategoryId",
  upload.single("logo"),
  auth,
  editSubCategory
);
routs.get("/getProductTypeById/:productTypeId", getProductTypeById);
routs.post(
  "/createProductType",
  upload.single("logo"),
  auth,
  createProductType
);
routs.get("/getAllSubCategory", getAllSubCategory);
routs.get("/getAllProductType", getAllProductType);
routs.get("/getVariantById/:variantId", getVariantById);
routs.post(
  "/updateVariant/:variantId",
  upload.fields([{ name: "images[]", maxCount: 10 }]),
  updateVariants
);
routs.post(
  "/createVariant",
  upload.fields([{ name: "images[]", maxCount: 10 }]),
  addVariants
);
routs.get(
  "/deleteVariant/:variantId",
  auth,
  upload.single("logo"),
  deleteVariants
);
routs.post("/updateProduct", upload.single("logo"), auth, updateProduct);
routs.post("/activeProduct/:categoryId", activeProduct);
routs.post("/featuredMainCategory/:categoryId", featuredMainCategory);
routs.post("/featuredSubCategory/:categoryId", featuredSubCategory);
routs.post("/featuredBrand/:categoryId", featuredBrand);
routs.post("/featuredProduct/:categoryId", featuredProduct);
routs.get("/getAllFeaturedBrand", getAllFeaturedBrand);
routs.get("/getAllFeaturedCategory", getAllFeaturedCategory);
routs.get("/getAllFeaturedSubCategory", getAllFeaturedSubCategory);
routs.get("/getAllFeaturedProduct", getAllFeaturedProduct);
routs.get(
  "/getFeaturedProductBasedOnCategory/:categoryId",
  getFeaturedProductBasedOnCategory
);
routs.get("/brandBasedOnCategory/:categoryId", brandBasedOnCategory);
routs.get("/deleteNonProductVariants", deleteNonProductVariants);
//Wishlist
routs.post("/addToWishlist", auth, addToWishlist);
routs.get("/getWishlistItems", auth, getTheWishlist);
routs.post("/deleteFromWishlist", auth, deleteFromWishlist);

//Cart
routs.post("/addToCart", auth, addToCart);
routs.get("/getCartItems", auth, getTheCart);
routs.get("/validateUtsav", auth, validateCartForUtsav);
routs.post("/deleteFromCart", auth, deleteFromCart);
routs.get("/clearCart", auth, clearCart);
routs.post("/removeFromCart", auth, removeFromCart);
//order
routs.post("/placeOrder", auth, apiKeyMiddleware, placeOrder);
routs.get("/getOrderDetails", auth, getOrderDetails);
routs.get("/getOrderById/:orderId", auth, getOrderById);
routs.post("/updateStatus/:orderId", auth, updateStatus);
routs.get("/getOrderByIdAdmin/:orderId", getOrderById);
routs.post("/updateStatusAdmin/:orderId", updateStatus);
routs.post("/getOrderByStatus", auth, getOrderByStatus);
routs.get("/getAllOrder",authad, getAllOrder);
routs.get("/sales/percentage-by-category", getSalesPercentageByCategory);
routs.post("/editOrder", auth, editOrder);
routs.get("/orderStatusDetails/:orderId", orderStatusDetails);
routs.post("/setDeliveryDate", setDeliveryDate);
routs.get("/cancelDelivery/:orderId", cancelDelivery);
routs.get("/downloadInvoice/:orderId", downloadInvoice);
//Address
routs.post("/addAddress", auth, addAddress);
routs.get("/getAddressOfUser", auth, getAddressOfUser);
routs.post("/updateAddressOfUser", auth, updateAddressOfUser);
routs.get("/deleteAddress/:addressId", auth, deleteAddress);
routs.post("/setDefaultAddress", auth, setDefaultAddress);
//payment
routs.post("/create-order", auth, paymentDetails);
routs.post("/verify-payment", auth, verifySignature);

//giftCard

routs.post("/createGiftCard", auth, createGiftCard);
routs.get("/getGiftCardDetails/:giftCardId", auth, getGiftCardDetails);
routs.get("/getGiftCardByUser", auth, getGiftCardByUser);
routs.post(
  "/createGiftCardTemplate",
  upload.single("template"),
  createGiftCardTemplate
);
routs.get("/getAllGiftCard", getAllGiftCard);
routs.get("/getAllTemplates", getAllTemplates);
routs.delete("/deleteTemplate/:templateId", deleteTemplate);
routs.get("/getTemplateId/:templateId", getTemplateId);
routs.post(
  "/editTemplateId/:templateId",
  upload.single("template"),
  editTemplateId
);
routs.post("/redeemGiftCard", auth, redeemGiftCard);
//wallet
routs.post("/addBalance", auth, addBalance);
routs.get("/showTransactions", auth, showTransactions);
routs.get("/getBalance", auth, getBalance);
routs.post("/addBalanceFromAdmin", addBalanceFromAdmin);
routs.get("/getBalanceFromAdmin/:userId", getBalanceFromAdmin);
routs.get("/addWallet", addWallet);
routs.get("/getTotalBalance", getTotalBalance);
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
routs.post("/register_admin", userRegistrationValidation, adminRegistration);
routs.post("/login_admin", userLoginValidation, adminLogin);
routs.post("/refresh_token", auth, sendMailVerificationAdmin);
routs.post(
  "/send_mail_Varification_for_admin",
  emailVarification,
  sendMailVerificationAdmin
);
routs.post("/otp_verification_admin", verifyOtp);
routs.get("/adminDetails", auth, adminDetails);
routs.post("/updateAdminDetails", auth, updateAdminDetails);

routs.post(
  "/createReview/:productId",
  auth,
  upload.fields([{ name: "images[]", maxCount: 10 }]),
  createReview
);
routs.get("/GetAllReviews/:productId", GetAllReviews);
routs.get("/reviewByID/:productId/:reviewId", auth, reviewByID);
routs.post("/updateReview/:productId/:reviewId", auth, updateReview);
routs.get("/deleteReview/:reviewId", auth, deleteReview);
routs.get("/getAvgRating/:productId", getAvgRating);

//

routs.post("/authenticate", auth, authenticate);
routs.get("/createOrder", auth, createOrder);

//banner

routs.post("/createBanner", upload.single("bannerImg"), createBanner);
routs.post("/editBanner/:bannerId", upload.single("bannerImg"), editBanner);
routs.get("/getAllBannersByBannerType", getBannersByBannerTypeAndDetails);
routs.get("/getAllBanners", getAllBanner);
routs.get("/getBannersWithFilters", getBannersWithFilters);
routs.get("/getAllBannerTypes", getAllBannerTypes);
routs.delete("/deleteBanner/:bannerId", deleteBanner);
routs.post("/publishBanner/:bannerId", publishBanner);
routs.get("/getBannerById/:bannerId", getBannerById);
//Deals
routs.post("/createFlashDeal", upload.single("banner"), createFlashDeal);
routs.post("/createFeaturedDeal", upload.single("banner"), createFeaturedDeal);
routs.post("/createDealOfTheDay", upload.single("banner"), createDealOfTheDay);
routs.get("/getAllFlashDeal", getAllFlashDeal);
routs.get("/getAllFeaturedDeals", getAllFeaturedDeals);
routs.get("/getDealOfTheDay", getDealOfTheDay);
routs.get("/getFlashDealById/:dealId", getFlashDealById);
routs.get("/getFeaturedDealById/:dealId", getFeaturedDealById);
routs.get("/getDEalOfTheDayById/:dealId", getDEalOfTheDayById);
routs.delete("/deleteDealOfTheDay/:dealId", deleteDealOfTheDay);
routs.delete("/deleteFeaturedDeal/:dealId", deleteFeaturedDeal);
routs.delete("/deleteFlashDeal/:dealId", deleteFlashDeal);
routs.post(
  "/editFlashDealById/:dealId",
  upload.single("banner"),
  editFlashDealById
);
routs.post(
  "/editFeaturedDealById/:dealId",
  upload.single("banner"),
  editFeaturedDealById
);
routs.post(
  "/editDEalOfTheDayById/:dealId",
  upload.single("banner"),
  editDEalOfTheDayById
);
routs.post("/addProductFlashDeal/:dealId", addProductFlashDeal);
routs.post("/addProductFeaturedDeal/:dealId", addProductFeaturedDeal);
routs.post("/updateStatusFlashDeal/:dealId", updateStatusFlashDeal);
routs.post("/updateStatusFeaturedDeal/:dealId", updateStatusFeaturedDeal);
routs.post("/updateStatusDealOfTheDay/:dealId", updateStatusDealOfTheDay);
routs.post("/deleteProductFeaturedDeal/:dealId", deleteProductFeaturedDeal);
routs.post("/deleteProductFlashDeal/:dealId", deleteProductFlashDeal);
routs.get("/getAllFlashDealOnUser", getAllFlashDealOnUser);
routs.get("/getAllFeaturedDealsOnUser", getAllFeaturedDealsOnUser);
routs.get("/getDealOfTheDayOnUser", getDealOfTheDayOnUser);
routs.get("/getFlashDealByIdOnUser/:dealId", getFlashDealByIdOnUser);
routs.get("/getFeaturedDealByIdOnUser/:dealId", getFeaturedDealByIdOnUser);
routs.get("/getDEalOfTheDayByIdOnUser/:dealId", getDEalOfTheDayByIdOnUser);

//coupons

routs.post("/createCoupons", createCoupons);
routs.post("/applyCoupon", auth, applyCoupon);
routs.get("/getTheCoupon/:couponId", getTheCoupon);
routs.post("/updateCoupons/:couponsId", updateCoupons);
routs.delete("/deleteCoupons/:couponId", deleteCoupons);
routs.get("/getAllCoupons", getAllCoupons);
routs.post("/updateStatusCoupons/:couponId", updateStatusCoupons);
routs.get("/getAllCouponsOnUser/:totalOrderAmount", auth, getAllCouponsOnUser);

//referral
routs.get("/shareReferralCode", auth, shareReferralCode);
//routs.post("/redeemedReferral", auth, redeemedReferral);

//utsab

routs.post("/addMembershipPlan", addMembershipPlan);
routs.get("/getMemberShipPlan", getMemberShipPlan);
routs.get("/isUtsabApplicable", auth, isUtsabApplicable);
routs.get("/totalOrderOfUtsav", totalOrderOfUtsav);
routs.get("/totalSpendOfMember/:userId", totalSpendOfMemberSingle);
routs.post("/applyForBorrowMember", auth, addBorrowMember);
routs.post("/addLeader/:userId", addLeader);

routs.post("/getLeaderDetails/:userId", getLeaderDetails);
routs.get("/getAllBorrowLIst", getAllBorrowLIst);
routs.get("/getAllLeader", getAllLeader);
routs.get("/getAllMemberList", getAllMemberList);
routs.post("/addBorrowMembershipPlan", addBorrowMembershipPlan);
routs.get("/getReferralDetails/:userId", getReferralDetailsSingle);
routs.get("/getMemberById/:userId", getMemberById);
routs.get("/getBorrowMemberShipPlan", getBorrowMemberShipPlan);
routs.get("/getAllWalletTransaction", getAllWalletTransaction);
routs.post("/approveBorrowRequest/:requestId", approveBorrowRequest);
routs.post("/approveLeaderRequest/:requestId", approveLeaderRequest);
routs.get("/getAllApprovedLeader", getAllApprovedLeader);
routs.get("/getProductByName", getProductByName);

//admin_user
routs.post("/blockingCustomer/:userId", blockingCustomer);
routs.get("/deleteCustomer/:userId", deleteCustomer);
routs.get("/getCustomerDetailsById/:userId", getCustomerDetailsById);
routs.get("/getAllUser",authad, getAllUser);
routs.post("/makeUtsabMember/:userId", makeUtsabMember);
routs.get("/customerOrderDetails/:userId", customerOrderDetails);

//utsavGallery
routs.post(
  "/createUtsavGallery",
  upload.single("bannerImg"),
  createUtsavGallery
);
routs.post("/markAsaNewArrivals/:productId", markAsaNewArrivals);
routs.post("/markAsaUtsavFeaturedBrand/:brandId", markAsaUtsavFeaturedBrand);
routs.get("/getAllNewArrivals", getAllNewArrivals);
routs.get("/getAllUtsavFeaturedBrand", getAllUtsavFeaturedBrand);
routs.get("/getAllGallery", getAllGallery);
routs.get("/getGalleryDetailsById/:galleryId", getGalleryDetailsById);
routs.delete("/deleteGalleryById/:galleryId", deleteGalleryById);
routs.post(
  "/editGalleryDetails/:galleryId",
  upload.single("bannerImg"),
  editGalleryDetails
);
routs.post("/publishGalleryById/:galleryId", publishGalleryById);
routs.get("/getAllPublishedGallery", getAllPublishedGallery);

//admin_review
routs.get("/getAllReviews", getAllReviews);

//utsavProduct

routs.get("/getAllUtsavProduct", getAllUtsavProduct);
routs.get("/getAllTopSellingBrand", getAllTopSellingBrand);
routs.get("/getAllTopSellingProduct", getAllTopSellingProduct);
routs.get("/getAllFeaturedProductType", getAllFeaturedProductType);
routs.post("/makeTopSellingProduct/:productId", makeTopSellingProduct);
routs.post("/makeTopSellingBrand/:brandId", makeTopSellingBrand);
routs.post(
  "/makeProductTypeIsFeatured/:productTypeId",
  makeProductTypeIsFeatured
);

//notification
routs.post("/sendAppNotification", sendAppNotification);

//productSearch
routs.get(
  "/getAllSearchTypeBasedOnSubCategory/:subCategoryId",
  getAllSearchTypeBasedOnSubCategory
);
routs.get(
  "/getAllSearchTypeBasedOnProductType/:productTypeId",
  getAllSearchTypeBasedOnProductType
);
routs.get(
  "/getAllSearchTypeBasedOnProduct/:productTypeId",
  getAllSearchTypeBasedOnProduct
);
routs.get("/getAllVariantsOnUser", getAllVariantsOnUser);
routs.get("/getProductTypesBasedOnBrand/:brandId", getProductTypesBasedOnBrand);
routs.get(
  "/getBrandsBasedOnProductType/:productTypeId",
  getBrandsBasedOnProductType
);
//payu

routs.post("/paymentResponse", paymentResponse);
routs.post("/paymentDetail", auth, paymentDetail);
routs.post("/success", paymentResponse);
routs.post("/failure", paymentResponse);

//searchengine
routs.get(
  "/getAllProductInformationBasedOnProduct",
  getAllProductInformationBasedOnProduct
);
routs.get("/getSearchData", getSearchDataFirst);
routs.get("/getSearchDataSecond", getSearchDataSecond);
routs.get("/productSearchDirectory", productSearchDirectory);
//routs.get("/searchAndIterate", searchAndIterate);
//routs.get("/searchEntityByName", searchEntityByName);

//google login
routs.get("/google", loginWithGoogle);
routs.get("/google/callback", googleCallback);
//fashion Category
routs.post(
  "/createFashionCategory",
  upload.single("logoImg"),
  createFashionCategory
);
routs.post(
  "/editFashionCategory/:fashionCategoryId",
  upload.single("logoImg"),
  editFashionCategory
);
routs.get("/deleteFashionCategory/:fashionCategoryId", deleteFashionCategory);
routs.get("/getFashionCategoryById/:fashionCategoryId", getFashionCategoryById);
routs.get("/getAllFashionCategory", getAllFashionCategory);
//fashion Blog
routs.post("/createBlog", upload.any(), createBlog);
routs.post("/editFashionBlog/:fashionBlogId", upload.any(), editFashionBlog);
routs.get("/deleteFashionBlog/:fashionBlogId", deleteFashionBlog);
routs.get("/getFashionBlogById/:fashionBlogId", getFashionBlogById);
routs.get(
  "/getBlogsByFashionCategory/:fashionCategoryId",
  getBlogsFashionCategoryUser
);
routs.get("/getAllFashionBlog", getAllFashionBlog);
routs.post("/loginUsingPhoneNumber", loginUsingPhoneNumber);
routs.post("/sendOtpToPhone", sendOtpToPhone);
routs.post("/activeBrandById/:brandId", activeBrandById);
routs.post("/activeCategoryById/:categoryId", activeCategoryById);
routs.post("/activeSubCategoryById/:subCategoryId", activeSubCategoryById);
routs.post("/activeProductTypeById/:productTypeId", activeProductTypeById);

//message
routs.post("/messageForUtsavMember", messageForUtsavMember);
routs.post("/messageForOrderDelivary", messageForOrderDelivary);
routs.post("/messageForOrderOnTheWay", messageForOrderOnTheWay);
routs.post("/messageForOrderConfirmed", messageForOrderConfirmed);
routs.post("/contactUs", contactUs);
routs.get("/settings", getSettings);
routs.get("/settings/:id",authad, getSettingById);
routs.post("/settings", createSetting);
routs.put("/settings/:id",authad, updateSetting);
routs.delete("/settings/:id",authad, deleteSetting);
routs.post('/createComponent', createComponent);
routs.get('/gethome', getAllComponents);
routs.get('/home:id', getComponentById); 
routs.put('/home:id', updateComponent); 
routs.delete('/home:id', deleteComponent);
//Reward
router.post("/addRewardPoints", auth, addRewardPoints);
router.get("/showRewardTransactions", auth, showRewardTransactions);
router.get("/getRewardBalance", auth, getRewardBalance);
router.post("/addRewardFromAdmin", addRewardFromAdmin);
router.get("/getRewardBalanceFromAdmin/:userId", getRewardBalanceFromAdmin);
router.get("/addRewardWallet", addRewardWallet);
router.get("/getTotalRewards", getTotalRewards); 
module.exports = routs;
