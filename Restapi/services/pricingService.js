// controllers/cartAndWishlistController.js

const Variant = require("../models/product/Varient");
const Coupon  = require("../models/Coupons/coupons");
const User    = require("../models/auth/userSchema");
const Reward  = require("../models/reward/Reward");

/**
 * getBuyNowPricing:
 *   - userId:        ObjectId of the logged‐in user
 *   - variantId:     ObjectId of the variant to purchase
 *   - quantity:      Number of units
 *   - couponCode:    (string|null) optional coupon code
 *   - rewardbalUsed: (boolean) whether the user wants to apply reward points
 *
 * Steps:
 *   1) Fetch User → read is_utsav
 *   2) Fetch Variant → ensure is_active & in‐stock
 *   3) Determine unitPriceToCharge:
 *        if (isUtsavUser && variant.utsavPrice != null) → utsavPrice
 *        else                                  → sellingPrice
 *
 *   4) Compute each field (for exactly one‐item “Buy Now”):
 *        ● sellingPortion    = sellingPrice × quantity
 *        ● utsavPortion      = (utsavPrice or sellingPrice) × quantity
 *        ● subtotal          = unitPriceToCharge × quantity
 *        ● totalBeforeShipping = sellingPortion
 *        ● shippingCost      = variant.shippingCost (₹60 min if totalBeforeShipping ≤ 499)
 *        ● total             = totalBeforeShipping + shippingCost
 *        ● discount          = (unitPrice − sellingPrice) × quantity
 *        ● tax               = (sellingPortion / (100 + taxPercent)) × taxPercent
 *        ● utsavTotal        = utsavPortion
 *        ● utsavDiscount     = (sellingPrice − utsavPrice) × quantity
 *
 *   5) Apply coupon if provided:
 *        couponDiscount = either flat or percentage on sellingPortion,
 *        capped so that final payable never < 0
 *
 *   6) Compute amountAfterCoupon depending on Utsav‐status:
 *      - if isUtsavUser:   amountAfterCoupon = utsavTotal − couponDiscount
 *      - else:             amountAfterCoupon = total − couponDiscount
 *
 *   7) If rewardbalUsed is true, fetch Reward document,
 *        rewardUsed = min(availablePoints, amountAfterCoupon).
 *
 *   8) finalTotal = amountAfterCoupon − rewardUsed.
 *
 *   9) Build paymentMethods (COD only if variant.cod === true).
 *
 *  10) Return JSON:
 *       {
 *         variant: { …, requestedQuantity },
 *         pricing: {
 *           subtotal, total, discount, tax,
 *           shippingCost, utsavTotal, utsavDiscount
 *         },
 *         couponDiscount,
 *         rewardUsed,
 *         finalTotal,
 *         paymentMethods: [ … ]
 *       }
 *
 *  No writes to the database occur here.
 */
async function getBuyNowPricing({
  userId,
  variantId,
  quantity,
  couponCode,
  rewardbalUsed,
}) {
  // 1) Fetch user → read is_utsav
  const user = await User.findById(userId).select("is_utsav").lean();
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const isUtsavUser = Boolean(user.is_utsav);

  // 2) Fetch variant → ensure is_active & in-stock
  const variant = await Variant.findById(variantId)
    .select(`
      unitPrice
      sellingPrice
      utsavPrice
      utsavDiscount
      taxPercent
      shippingCost
      cod
      quantity
      is_active
      images
    `)
    .lean();

  if (!variant) {
    const err = new Error("Variant not found");
    err.statusCode = 404;
    throw err;
  }
  if (!variant.is_active) {
    const err = new Error("This variant is not active");
    err.statusCode = 400;
    throw err;
  }
  if (variant.quantity < quantity) {
    const err = new Error("Insufficient stock for requested quantity");
    err.statusCode = 400;
    throw err;
  }

  // 3) Determine per-unit price to charge
  const unitPriceToCharge =
    isUtsavUser && typeof variant.utsavPrice === "number"
      ? variant.utsavPrice
      : variant.sellingPrice;

  // 4a) Compute “sellingPortion” and “utsavPortion”
  const sellingPortion = parseFloat(
    (variant.sellingPrice * quantity).toFixed(2)
  );
  const utsavPortion = parseFloat(
    (
      (typeof variant.utsavPrice === "number"
        ? variant.utsavPrice
        : variant.sellingPrice) *
      quantity
    ).toFixed(2)
  );

  // 4b) Subtotal = unitPriceToCharge × quantity
  const subtotal = parseFloat((unitPriceToCharge * quantity).toFixed(2));

  // 4c) totalBeforeShipping = sellingPortion
  let totalBeforeShipping = sellingPortion;

  // 4d) shippingCost (flat shippingCost, ₹60 min if totalBeforeShipping ≤ ₹499)
  let shippingCost = variant.shippingCost || 0;
  if (totalBeforeShipping <= 499) {
    shippingCost = Math.max(shippingCost, 60);
  }
  shippingCost = parseFloat(shippingCost.toFixed(2));

  // 4e) total = totalBeforeShipping + shippingCost
  const total = parseFloat((totalBeforeShipping + shippingCost).toFixed(2));

  // 4f) discount = (unitPrice − sellingPrice) × quantity
  const perUnitBaseDiscount = variant.unitPrice - variant.sellingPrice;
  const totalBaseDiscount = parseFloat(
    (perUnitBaseDiscount * quantity).toFixed(2)
  );

  // 4g) tax = (sellingPortion / (100 + taxPercent)) × taxPercent
  const tax = parseFloat(
    (
      (sellingPortion / (variant.taxPercent + 100)) *
      variant.taxPercent
    ).toFixed(2)
  );

  // 4h) utsavTotal = utsavPortion
  const utsavTotal = utsavPortion;

  // 4i) utsavDiscount = (sellingPrice − utsavPrice) × quantity (only if utsavPrice exists)
  let totalUtsavDiscount = 0;
  if (isUtsavUser && typeof variant.utsavPrice === "number") {
    const perUnitUtsavDiscount = variant.sellingPrice - variant.utsavPrice;
    totalUtsavDiscount = parseFloat(
      (perUnitUtsavDiscount * quantity).toFixed(2)
    );
  }

  // 5) Apply coupon if provided
  let couponDiscount = 0;
  if (couponCode) {
    const now = new Date();
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      status: true,
      Start_Date: { $lte: now },
      Expire_Date: { $gte: now },
    }).lean();

    if (!coupon) {
      const err = new Error("Invalid or expired coupon code");
      err.statusCode = 400;
      throw err;
    }

    // Check minimum purchase on sellingPortion
    if (sellingPortion < coupon.Minimum_Purchase) {
      const err = new Error(
        `Coupon applies only on orders with subtotal ≥ ₹${coupon.Minimum_Purchase}`
      );
      err.statusCode = 400;
      throw err;
    }

    if (coupon.Discount_Type.toLowerCase() === "percentage") {
      couponDiscount = parseFloat(
        ((sellingPortion * coupon.Discount_Value) / 100).toFixed(2)
      );
    } else {
      couponDiscount = parseFloat(coupon.Discount_Value.toFixed(2));
    }

    // Cap couponDiscount so final never < 0 for whichever total we use
    if (isUtsavUser) {
      // cap against utsavTotal
      const maxAllowed = parseFloat((utsavTotal).toFixed(2));
      if (couponDiscount > maxAllowed) {
        couponDiscount = maxAllowed;
      }
    } else {
      // cap against total
      const maxAllowed = parseFloat((total).toFixed(2));
      if (couponDiscount > maxAllowed) {
        couponDiscount = maxAllowed;
      }
    }
  }

  // 6) Compute amountAfterCoupon depending on Utsav status
  let amountAfterCoupon;
  if (isUtsavUser) {
    // Utsav members pay utsavTotal, then subtract coupon
    amountAfterCoupon = parseFloat((utsavTotal - couponDiscount).toFixed(2));
  } else {
    // Non-Utsav pay total, then subtract coupon
    amountAfterCoupon = parseFloat((total - couponDiscount).toFixed(2));
  }
  amountAfterCoupon = Math.max(amountAfterCoupon, 0);

  // 7) If rewardbalUsed === true, apply reward points
  let rewardUsed = 0;
  if (rewardbalUsed) {
    const rewardDoc = await Reward.findOne({ userId }).lean();
    const availablePoints = rewardDoc ? rewardDoc.points : 0;
    // 1 point = ₹1
    rewardUsed = Math.min(availablePoints, amountAfterCoupon);
    rewardUsed = parseFloat(rewardUsed.toFixed(2));
  }

  // 8) finalTotal = amountAfterCoupon − rewardUsed
  let finalTotal = parseFloat((amountAfterCoupon - rewardUsed).toFixed(2));
  finalTotal = Math.max(finalTotal, 0);

  // 9) Determine paymentMethods (COD only if variant.cod === true)
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
      available: variant.cod === true,
      icon: "mobile",
      image: "https://finafid.com/image/cod.jpg",
    },
  ];

  // 10) Build the final PriceDetails object
  const priceDetails = {
    subtotal,           // unitPriceToCharge × qty
    total,              // totalBeforeShipping + shippingCost
    discount: totalBaseDiscount,      // (unitPrice − sellingPrice)× qty
    tax,                // tax portion on sellingPortion
    shippingCost,       // final shippingCost after ₹60 minimum if needed
    utsavTotal,         // ∑(utsavPrice × qty)
    utsavDiscount: totalUtsavDiscount // ∑((sellingPrice − utsavPrice) × qty)
  };

  // 11) Return the assembled payload
  return {
    variant: {
      ...variant,
      requestedQuantity: quantity,
    },
    pricing: priceDetails,
    couponDiscount,
    rewardUsed,
    finalTotal,
    paymentMethods,
  };
}

async function calculateCartPricing(userId, items, couponCode = "", useReward = false) {
  // 1) Fetch User → read is_utsav
  const user = await User.findById(userId).select("is_utsav").lean();
  if (!user) throw new Error("User not found");
  const isUtsavUser = Boolean(user.is_utsav);

  // 2) Load each Variant by productId; check is_active & stock
  const detailedItems = [];
  for (const it of items) {
    const variant = await Variant.findById(it.productId)
      .select(`
        name
        sku
        attributes
        images
        unitPrice
        sellingPrice
        utsavPrice
        utsavDiscount
        taxPercent
        shippingCost
        cod
        quantity
        is_active
      `)
      .lean();

    if (!variant) throw new Error(`Variant ${it.productId} not found`);
    if (!variant.is_active) throw new Error(`Variant ${it.productId} is not active`);
    if (variant.quantity < it.itemQuantity) throw new Error(`Product ${variant._id} out of stock`);

    detailedItems.push({ variant, qty: it.itemQuantity });
  }

  // 3) Initialize aggregators
  let subtotal = 0;
  let totalBeforeShipping = 0;
  let totalBaseDiscount = 0;
  let totalTax = 0;
  let totalShipping = 0;
  let totalUtsavPortion = 0;
  let totalUtsavDiscount = 0;

  // 4) Build cartItems array with per-item details
  const cartItems = detailedItems.map(({ variant, qty }) => {
    const {
      _id: productId,
      name,
      sku,
      attributes,
      images,
      unitPrice,
      sellingPrice,
      utsavPrice,
      taxPercent,
      shippingCost: itemShipping,
      cod,
    } = variant;

    // 4a) Choose per-unit charge
    const perUnitCharge = isUtsavUser && typeof utsavPrice === "number"
      ? utsavPrice
      : sellingPrice;

    // 4b) Subtotal aggregation (sum of MRP × qty)
    subtotal += unitPrice * qty;

    // 4c) totalBeforeShipping aggregation (sum of sellingPrice × qty)
    const itemSellingPortion = sellingPrice * qty;
    totalBeforeShipping += itemSellingPortion;

    // 4d) totalBaseDiscount aggregation
    const perItemDiscount = (unitPrice - sellingPrice) * qty;
    totalBaseDiscount += perItemDiscount;

    // 4e) totalTax aggregation
    const itemTax = parseFloat(
      ((itemSellingPortion / (taxPercent + 100)) * taxPercent).toFixed(2)
    );
    totalTax += itemTax;

    // 4f) totalShipping aggregation (just sum all itemShipping)
    totalShipping += itemShipping || 0;

    // 4g) totalUtsavPortion aggregation
    const itemUtsavPortion = (typeof utsavPrice === "number" ? utsavPrice : sellingPrice) * qty;
    totalUtsavPortion += itemUtsavPortion;

    // 4h) totalUtsavDiscount aggregation
    let perItemUtsavDiscount = 0;
    if (isUtsavUser && typeof utsavPrice === "number") {
      perItemUtsavDiscount = (sellingPrice - utsavPrice) * qty;
      totalUtsavDiscount += perItemUtsavDiscount;
    }

    return {
      productId,
      name,
      sku,
      attributes,
      images,
      itemQuantity: qty,
      unitPrice,
      sellingPrice,
      utsavPrice,
      taxPercent,
      shippingCost: itemShipping,
      cod,
      perItemDiscount: parseFloat(perItemDiscount.toFixed(2)),
      perItemTax: itemTax,
      perItemUtsavDiscount: parseFloat(perItemUtsavDiscount.toFixed(2)),
    };
  });

  // 5) Enforce ₹60 minimum shipping if totalBeforeShipping ≤ ₹499
  if (totalBeforeShipping <= 499) {
    totalShipping = Math.max(totalShipping, 60);
  }
  totalShipping = parseFloat(totalShipping.toFixed(2));

  // 6) Compute total = totalBeforeShipping + totalShipping
  const total = parseFloat((totalBeforeShipping + totalShipping).toFixed(2));

  // 7) Round other aggregates
  subtotal = parseFloat(subtotal.toFixed(2));
  totalBaseDiscount = parseFloat(totalBaseDiscount.toFixed(2));
  totalTax = parseFloat(totalTax.toFixed(2));
  totalUtsavPortion = parseFloat(totalUtsavPortion.toFixed(2));
  totalUtsavDiscount = parseFloat(totalUtsavDiscount.toFixed(2));

  // 8) Apply coupon if present
  let couponDiscount = 0;
  if (couponCode.trim() !== "") {
    const now = new Date();
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      status: true,
      Start_Date: { $lte: now },
      Expire_Date: { $gte: now },
    }).lean();

    if (!coupon) throw new Error("Invalid or expired coupon code");
    if (totalBeforeShipping < coupon.Minimum_Purchase) {
      throw new Error(`Coupon requires minimum purchase ₹${coupon.Minimum_Purchase}`);
    }

    if (coupon.Discount_Type.toLowerCase() === "percentage") {
      couponDiscount = parseFloat(
        ((totalBeforeShipping * coupon.Discount_Value) / 100).toFixed(2)
      );
    } else {
      couponDiscount = parseFloat(coupon.Discount_Value.toFixed(2));
    }

    // Cap couponDiscount so it never exceeds payable amount
    if (isUtsavUser) {
      couponDiscount = Math.min(couponDiscount, totalUtsavPortion);
    } else {
      couponDiscount = Math.min(couponDiscount, total);
    }
  }

  // 9) Compute amountAfterCoupon
  let amountAfterCoupon;
  if (isUtsavUser) {
    amountAfterCoupon = parseFloat((totalUtsavPortion - couponDiscount).toFixed(2));
  } else {
    amountAfterCoupon = parseFloat((total - couponDiscount).toFixed(2));
  }
  amountAfterCoupon = Math.max(amountAfterCoupon, 0);

  // 10) Apply reward points if requested
  let rewardUsed = 0;
  if (useReward) {
    const rewardDoc = await Reward.findOne({ userId }).lean();
    const availablePoints = rewardDoc ? rewardDoc.points : 0;
    rewardUsed = Math.min(availablePoints, amountAfterCoupon);
    rewardUsed = parseFloat(rewardUsed.toFixed(2));
  }

  // 11) Compute finalTotal
  let finalTotal = parseFloat((amountAfterCoupon - rewardUsed).toFixed(2));
  finalTotal = Math.max(finalTotal, 0);

  // 12) Build final “pricing” object
  const pricing = {
    subtotal,      // Σ(unitPrice × qty)
    total,         // Σ(sellingPrice × qty) + shipping
    discount: totalBaseDiscount,   // Σ((unitPrice − sellingPrice) × qty)
    tax: totalTax,                 // Σ(per-item tax)
    shippingCost: totalShipping,   // Σ(per-item shipping, with ₹60 min)
    utsavTotal: totalUtsavPortion, // Σ((utsavPrice or sellingPrice) × qty)
    utsavDiscount: totalUtsavDiscount // Σ((sellingPrice − utsavPrice) × qty)
  };

  return {
    cartItems,
    pricing,
    couponDiscount,
    rewardUsed,
    finalTotal
  };
}



module.exports = {
  getBuyNowPricing,
  calculateCartPricing
};
