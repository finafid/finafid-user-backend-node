const cart = require("../../models/productBag/cartSc");
const wishList = require("../../models/productBag/wishListSc");
const User = require("../../models/auth/userSchema");
const ProductDetails = require("../../models/productBag/ProductDetails");
const MemberShipPlan = require("../../models/Utsab/MembershipPlan");
const variants = require("../../models/product/Varient");
const Reward = require("../../models/reward/Reward");
const Coupon = require("../../models/Coupons/coupons");
const addToWishlist = async (req, res) => {
  try {
    const userData = req.user;
    const { productId } = req.body;

    // console.log(userData);
    const userDetails = await wishList.findOne({ UserId: userData._id });
    // console.log(userDetails)
    if (!userDetails) {
      const newWishList = new wishList({
        UserId: userData._id,
        productIdList: [productId],
      });
      await newWishList.save();
      const productIdList = await newWishList.populate('productIdList')
      return res.status(200).json(productIdList)
    } else {
      if (userDetails.productIdList.includes(productId) === true) {
        return res.status(200).json({
          success: false,
          message: "Item is already there"
        })
      }
      userDetails.productIdList.push(productId);
      await userDetails.save();
      const productIdList = await userDetails.populate('productIdList')
      return res.status(200).json(productIdList)
    }

    // return res.status(201).json({
    //   success: true,
    //   message: "Product added to wishlist successfully",
    // });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};

const getTheWishlist = async (req, res) => {
  try {
    const userDetails = await wishList
      .findOne({
        UserId: req.user._id,
      })
      .populate({
        path: "productIdList",
        populate: [
          {
            path: "productGroup",
            model: "Product",
            populate: {
              path: "brand",
              model: "Brand",
            },
          },
        ],
      });
    // if (!userDetails){
    //   return res.status(401).json({message:"No item found"});
    // }
    return res.status(200).json(userDetails);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};

const deleteFromWishlist = async (req, res) => {
  try {
    const userData = req.user;
    const { productId } = req.body;
    const userDetails = await wishList.findOne({
      UserId: userData._id,
    });

    if (!userDetails) {
      return res.status(500).json({
        success: false,
        message: "User wishlist is not there",
      });
    }
    if (userDetails.productIdList.includes(productId) === false) {
      return res.status(200).json({
        success: false,
        message: "no such Item in wishList"
      })
    }
    const itemIndex = userDetails.productIdList.findIndex(
      (item) => item.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    userDetails.productIdList.splice(itemIndex, 1);

    await userDetails.save();

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, itemQuantity = 1 } = req.body;
    const userCartDetails = await cart.findOne({ UserId: req.user._id });

    // Fetch product 

    const productDetails = await variants.findById(productId);
    if (!productDetails || productDetails.quantity === 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    // Check if requested quantity is within available stock
    if (itemQuantity > productDetails.quantity) {
      return res.status(400).json({
        success: false,
        message: `No items available in stock`,
      });
    }

    if (!userCartDetails) {
      // If the user does not have a cart, create a new cart with the product
      const newProductDetails = {
        productId,
        itemQuantity,
      };

      const newCart = new cart({
        UserId: req.user._id,
        cartItems: [newProductDetails],
      });
      await newCart.save();
      await newCart.populate("cartItems.productId");

      return res.status(200).json({
        products: newCart.cartItems,
        message: "Item added successfully",
      });
    } else {
      // Check if the product already exists in the cart
      const existingProductIndex = userCartDetails.cartItems.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (existingProductIndex >= 0) {
        // Check if the combined quantity exceeds stock
        const currentQuantity =
          userCartDetails.cartItems[existingProductIndex].itemQuantity;
        if (currentQuantity + itemQuantity > productDetails.quantity) {
          return res.status(400).json({
            success: false,
            message: `No more items available in stock`,
          });
        }
        userCartDetails.cartItems[existingProductIndex].itemQuantity += itemQuantity;
      } else {
        const newProductDetails = {
          productId,
          itemQuantity,
        };
        userCartDetails.cartItems.push(newProductDetails);
      }

      await userCartDetails.save();
      await userCartDetails.populate("cartItems.productId");

      return res.status(200).json({
        products: userCartDetails.cartItems,
        message: "Item added successfully",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};


const getTheCart = async (req, res) => {
  try {
    const userData = req.user;
    const userCartDetails = await cart
      .findOne({ UserId: userData._id })
      .populate({
        path: "cartItems",
        populate: {
          path: "productId",
          populate: {
            path: "productGroup",
            model: "Product",
          },
        },
      });

    if (!userCartDetails || userCartDetails.cartItems.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Cart is empty",
        paymentMethods: [],
      });
    }

    // Calculate total cart amount
   
    // Check if all items in the cart have cod: true
    const isCODAvailable = userCartDetails.cartItems.every(item => item.productId.cod === true);

    // Define payment methods
    const paymentMethods = [
      { lable:"Wallet",method: "Wallet", available: false,icon:"mobile",image: "https://finafid.com/image/mywallet.png"}, 
      { lable:"Card / UPI / Net Banking",method: "PayU", available: true,icon:"money",image: "https://finafid.com/image/payumoney.png" }, 
      { lable:"Cash on Delivery",method: "COD", available: isCODAvailable,icon:"mobile",image:"https://finafid.com/image/cod.jpg" },
    ];

    return res.status(200).json({
      success: true,
      cartItems: userCartDetails.cartItems,
      paymentMethods,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};



const validateCartForUtsav = async (req, res) => {
  try {
    const userData = req.user;

    // Fetch the user's cart
    const userCartDetails = await cart
      .findOne({ UserId: userData._id })
      .populate({
        path: "cartItems",
        populate: {
          path: "productId",
          populate: {
            path: "productGroup",
            model: "Product",
          },
        },
      });

    if (!userCartDetails || userCartDetails.cartItems.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Cart is empty or invalid",
      });
    }

    // Fetch the membership plan details
    const planDetails = await MemberShipPlan.findOne({ identity: "PLAN_IDENTITY" });
    if (!planDetails) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }
    const totalBasicReward = userCartDetails.cartItems.reduce(
      (total, item) => total + item.productId.basicReward,
      0
    );
    // Check if the user has already completed their first order
    if (userData.firstOrderComplete) {


      return res.status(200).json({
        success: true,
        isEligible: false,
        message: 'You can earn ₹' + totalBasicReward + ' as a reward for this order, which will be credited to your wallet.',
        totalBasicReward,

      });
    }

    // Calculate the total price of `isUtsav` products in the cart
    const utsavTotalPrice = userCartDetails.cartItems
      .filter(item => item.productId.isUtsav) // Filter items with `isUtsav: true`
      .reduce((total, item) => total + item.productId.sellingPrice * item.itemQuantity, 0);

    // console.log(`Utsav Products Total Price: ${utsavTotalPrice}`);
    // console.log(`Plan Threshold: ${planDetails.amount}`);

    // Validate the cart against the Utsav membership plan threshold
    if (utsavTotalPrice >= planDetails.amount) {
      return res.status(200).json({
        success: true,
        isEligible: true,
        totalBasicReward: totalBasicReward,
        message: "The Products are eligible for UTSAV membership.",
        utsavTotalPrice,
        planThreshold: planDetails.amount,
      });
    } else {
      return res.status(200).json({
        success: false,
        isEligible: false,
        totalBasicReward: totalBasicReward,
        message: 'You can earn ₹' + totalBasicReward + ' as a reward for this order, which will be credited to your wallet',
        utsavTotalPrice,
        planThreshold: planDetails.amount,

      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};



const deleteFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userCartDetails = await cart.findOne({ UserId: req.user._id });

    if (!userCartDetails) {
      return res.status(404).json({
        success: false,
        message: "User cart is not found",
      });
    }

    const itemIndex = userCartDetails.cartItems.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    userCartDetails.cartItems.splice(itemIndex, 1);

    await userCartDetails.save();

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
const clearCart = async (req, res) => {
  try {
    const userCartDetails = await cart.findOne({ UserId: req.user._id });
    if (!userCartDetails) {
      return res.status(200).json({
        success: false,
        message: " Cart is empty",
      });
    }
    const result = await cart.deleteOne({ UserId: req.user._id });
    return res.status(200).json({
      success: true,
      message: " Deleted Successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
const removeFromCart = async (req, res) => {
  try {
    const { productIdList } = req.body;
    const userCartDetails = await cart.findOne({ UserId: req.user._id });
    if (!userCartDetails) {
      return res.status(404).json({
        success: false,
        message: "User cart is not found",
      });
    }

    productIdList.forEach((element) => {
      const index = userCartDetails.cartItems.findIndex(
        (item) => item.productId.toString() === element.productId._id
      );
      if (index !== -1) {
        userCartDetails.cartItems.splice(index, 1); // Remove item at the found index
      }
    });

    await userCartDetails.save();

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};
async function removeItemFromCart(productIdList, userId) {
  const userCartDetails = await cart.findOne({ UserId: userId });

  if (!userCartDetails) {
    return { message: "Cart not found" };
  }
  // console.log({ userCartDetails: userCartDetails });
  productIdList.forEach((element) => {
    // console.log(element.productId._id);
    const index = userCartDetails.cartItems.findIndex(
      (item) => item.productId.toString() === element.productId._id.toString()
    );
    if (index !== -1) {
      // console.log(`Removing item with ID: ${element.productId._id}`);
      userCartDetails.cartItems.splice(index, 1);
    }
  });
  await userCartDetails.save();
  return { message: "Items removed from cart successfully" };
}

const getNewCart = async (req, res) => {
  try {
    const userData = req.user;
    const couponCodeRaw = (req.query.couponCode || "").trim().toUpperCase();
    // 1) Fetch user’s cart and populate product details
    const userCartDetails = await cart
      .findOne({ UserId: userData._id })
      .populate({
        path: "cartItems",
        populate: {
          path: "productId",
          select:
            "unitPrice sellingPrice taxPercent utsavPrice shippingCost cod name attributes images",
         
        },
      });

    

    // If empty or no cart, return zeros
    if (!userCartDetails || userCartDetails.cartItems.length === 0) {
      return res.status(200).json({
        success: true,
        cartItems: [],
        pricing: {
          subtotal: 0,
          total: 0,
          discount: 0,
          tax: 0,
          shippingCost: 0,
          utsavTotal: 0,
          utsavDiscount: 0,
        },
        couponDiscount: 0,
        finalTotal: 0,
        paymentMethods: [],
      });
    }

    const user = await User.findById(userData._id).select("is_utsav").lean();
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    // 2) Build a plain‐JS array for pricing calculation
    const cartItems = userCartDetails.cartItems.map((ci) => ({
      productId: {
        unitPrice: ci.productId.unitPrice,
        sellingPrice: ci.productId.sellingPrice,
        taxPercent: ci.productId.taxPercent,
        utsavPrice: ci.productId.utsavPrice,
        shippingCost: ci.productId.shippingCost,
        cod: ci.productId.cod,
      },
      itemQuantity: ci.itemQuantity,
    }));

    // 3) Check if user is an Utsav member
    const isUtsavUser = Boolean(user.is_utsav);

    // 4) Inline calculation of PriceDetails (sum over all items)
    let subtotal = 0;
    let totalBeforeShipping = 0;
    let discount = 0;
    let tax = 0;
    let utsavTax = 0;
    let shippingCost = 0;
    let utsavTotal = 0;
    let utsavDiscount = 0;

    for (const item of cartItems) {
      const {
        unitPrice,
        sellingPrice,
        taxPercent,
        utsavPrice,
        shippingCost: itemShipping,
      } = item.productId;
      const qty = item.itemQuantity;
      const unitSelling = unitPrice * qty;
      // a) Determine which per‐unit price to charge: utsavPrice if member & available, else sellingPrice
      const perUnitCharge = isUtsavUser && typeof utsavPrice === "number"
        ? utsavPrice
        : sellingPrice;

      // b) Subtotal portion = perUnitCharge × qty
      subtotal += unitSelling * qty;

      // c) totalBeforeShipping portion = sellingPrice × qty
      totalBeforeShipping += sellingPrice * qty;

      // d) “discount” portion: (unitPrice − sellingPrice) × qty
      const perUnitBaseDiscount = unitPrice - sellingPrice;
      discount += perUnitBaseDiscount * qty;

      // e) “tax” on selling portion:
      const sellingPortion = sellingPrice * qty;
      tax += (sellingPortion / (taxPercent + 100)) * taxPercent;

      // f) “utsavTax” on utsav portion (or fallback to sellingPrice)
      const upPortion = (typeof utsavPrice === "number" ? utsavPrice : sellingPrice) * qty;
      utsavTax += (upPortion / (taxPercent + 100)) * taxPercent;

      // g) Shipping cost sum:
      shippingCost += itemShipping || 0;

      // h) “utsavTotal” portion:
      utsavTotal += (utsavPrice) * qty;

      // i) “utsavDiscount” portion: (sellingPrice − utsavPrice) × qty (only if utsavPrice exists)
      if (typeof utsavPrice === "number") {
        utsavDiscount += (sellingPrice - utsavPrice) * qty;
      }
    }

    // 5) Enforce ₹60 minimum shipping if totalBeforeShipping ≤ ₹499
    if (totalBeforeShipping <= 499) {
      shippingCost = Math.max(shippingCost, 60);
    }

    // 6) Finalize and round
    subtotal = parseFloat(subtotal.toFixed(2));
    const total = parseFloat((totalBeforeShipping + shippingCost).toFixed(2));
    discount = parseFloat(discount.toFixed(2));
    tax = parseFloat(tax.toFixed(2));
    shippingCost = parseFloat(shippingCost.toFixed(2));
    utsavTotal = parseFloat(utsavTotal.toFixed(2));
    utsavDiscount = parseFloat(utsavDiscount.toFixed(2));

    // 7) Hard‐code couponDiscount = 0 (adjust if you accept coupon inputs)
    let couponDiscount = 0;
    if (couponCodeRaw) {
      const now = new Date();
      const coupon = await Coupon.findOne({
        code: couponCodeRaw,
        status: true,
        Start_Date: { $lte: now },
        Expire_Date: { $gte: now },
      }).lean();

      if (!coupon) {
        const err = new Error("Invalid or expired coupon code");
        err.statusCode = 400;
        throw err;
      }

      // Use totalBeforeShipping as the “sellingPortion” for minimum‐purchase check
      if (totalBeforeShipping < coupon.Minimum_Purchase) {
        const err = new Error(
          `Coupon requires a minimum purchase of ₹${coupon.Minimum_Purchase}`
        );
        err.statusCode = 400;
        throw err;
      }

      // Compute discount value
      if (coupon.Discount_Type.toLowerCase() === "percentage") {
        couponDiscount = parseFloat(
          ((totalBeforeShipping * coupon.Discount_Value) / 100).toFixed(2)
        );
      } else {
        couponDiscount = parseFloat(coupon.Discount_Value.toFixed(2));
      }

      // Cap couponDiscount so final never < 0
      if (isUtsavUser) {
        const maxAllowed = parseFloat(utsavTotal.toFixed(2));
        if (couponDiscount > maxAllowed) {
          couponDiscount = maxAllowed;
        }
      } else {
        const maxAllowed = parseFloat(total.toFixed(2));
        if (couponDiscount > maxAllowed) {
          couponDiscount = maxAllowed;
        }
      }
    }

    // 8) Compute amountAfterCoupon depending on Utsav status
    let amountAfterCoupon;
    if (isUtsavUser) {
      // Utsav members pay utsavTotal, then subtract coupon
      amountAfterCoupon = parseFloat((utsavTotal - couponDiscount).toFixed(2));
    } else {
      // Non-Utsav pay total, then subtract coupon
      amountAfterCoupon = parseFloat((total - couponDiscount).toFixed(2));
    }
    amountAfterCoupon = Math.max(amountAfterCoupon, 0);

    let rewardUsed = 0;
    if (req.query.useReward === "true") {
      // Fetch the user's reward balance
      const rewardDoc = await Reward.findOne({ userId: req.user._id }).lean();
      const availablePoints = rewardDoc ? rewardDoc.points : 0;
      // We assume 1 point = ₹1
      rewardUsed = Math.min(availablePoints, amountAfterCoupon);
      rewardUsed = parseFloat(rewardUsed.toFixed(2));
    }

    // 9) Final total after reward:
    let finalAmount = parseFloat((amountAfterCoupon - rewardUsed).toFixed(2));
    finalAmount = Math.max(finalAmount, 0);

    // 10) Determine COD availability (all items must allow COD)
    const isCODAvailable = userCartDetails.cartItems.every(
      (ci) => ci.productId.cod === true
    );

    // 11) Build paymentMethods
    const paymentMethods = [
      {
        label: "Wallet",
        method: "Wallet",
        available: true,
        icon: "mobile",
        image: "https://finafid.com/image/mywallet.png",
      },
      {
        label: "Card / UPI / Net Banking",
        method: "PayU",
        available: true,
        icon: "money",
        image: "https://finafid.com/image/payumoney.png",
      },
      {
        label: "Cash on Delivery",
        method: "COD",
        available: isCODAvailable,
        icon: "mobile",
        image: "https://finafid.com/image/cod.jpg",
      },
    ];

    // 12) Build the final “pricing” object
    const pricing = {
      subtotal,
      total,
      discount,
      tax,
      shippingCost,
      utsavTotal,
      utsavDiscount,
    };

    // 13) Return the response exactly in the requested shape
    return res.status(200).json({
      success: true,
      cartItems: userCartDetails.cartItems,
      pricing,
      couponDiscount,
      rewardUsed,
      finalTotal: finalAmount,
      paymentMethods,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};




module.exports = {
  addToWishlist,
  getTheWishlist,
  deleteFromWishlist,
  addToCart,
  getTheCart,
  getNewCart,
  deleteFromCart,
  clearCart,
  removeFromCart,
  removeItemFromCart,
  validateCartForUtsav
};
