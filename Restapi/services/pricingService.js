const Variant = require("../models/product/Varient");
const Coupon  = require("../models/Coupons/coupons");
const User    = require("../models/auth/userSchema");

/**
* @typedef {Object} PriceDetails
 * @property {number} subtotal       - ∑(unitPrice × quantity)
 * @property {number} total          - ∑(sellingPrice × quantity) + shipping (with ₹60 min if ≤ ₹499)
 * @property {number} discount       - subtotal − (sellingPrice × quantity)
 * @property {number} tax            - total tax portion on sellingPrice
 * @property {number} utsavTax       - total tax portion on utsavPrice
 * @property {number} shippingCost   - total shipping (with ₹60 min if needed)
 * @property {number} utsavTotal     - ∑(utsavPrice × quantity)
 * @property {number} utsavDiscount  - total − utsavTotal
 *
 * getBuyNowPricing:
 *   - userId:    ObjectId of the logged‐in user
 *   - variantId: ObjectId of the variant to purchase
 *   - quantity:  Number of units
 *   - couponCode: (string|null) optional coupon code
 *
 * Steps:
 *   1) Fetch User → read is_utsav
 *   2) Fetch Variant → ensure is_active & in‐stock
 *   3) Determine:
 *         unitPrice   = (isUtsavUser && variant.utsavPrice != null) ? utsavPrice : sellingPrice
 *         variantBase = { unitPrice, sellingPrice, utsavPrice, taxPercent, shippingCost }
 *   4) Compute PriceDetails exactly as calculatePrices() would do for a single‐item cart
 *   5) Compute variantUtsavDiscount = (variant.utsavDiscount × quantity) if isUtsavUser
 *   6) Validate & apply coupon (percentage vs. flat), capping so final total never < 0
 *   7) Return:
 *        {
 *          variant: { …, requestedQuantity },
 *          pricing: PriceDetails merged with couponDiscount,
 *          paymentMethods: [ Wallet, PayU, COD(if available) ]
 *        }
 *
 * (No writes to the database occur.)
 */
async function getBuyNowPricing({ userId, variantId, quantity, couponCode }) {
  // 1) Fetch user → read is_utsav
  const user = await User.findById(userId).select("is_utsav").lean();
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const isUtsavUser = Boolean(user.is_utsav);

  // 2) Fetch variant → ensure is_active & stock
  const variant = await Variant.findById(variantId)
    .select(`
      attributes
      name
      sku
      quantity
      unitPrice
      sellingPrice
      utsavPrice
      taxPercent
      cod
      shippingCost
      is_active
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

  // 3) Determine which price to charge per unit:
  //    - If user is Utsav and variant.utsavPrice exists, use that, else use sellingPrice
  const unitPriceToCharge = isUtsavUser && typeof variant.utsavPrice === "number"
    ? variant.utsavPrice
    : variant.sellingPrice;

  // 4) Compute “base discount” = (unitPrice – sellingPrice) × quantity
  //    (This is the difference between the “list price” (unitPrice) and actual sellingPrice.)
  const perUnitBaseDiscount = variant.unitPrice - variant.sellingPrice;
  const totalBaseDiscount = parseFloat((perUnitBaseDiscount * quantity).toFixed(2));

  // 5) Compute “Utsav discount” = (sellingPrice – utsavPrice) × quantity (if Utsav member)
  let perUnitUtsavDiscount = 0;
  if (isUtsavUser && typeof variant.utsavPrice === "number") {
    perUnitUtsavDiscount = variant.sellingPrice - variant.utsavPrice;
  }
  const totalUtsavDiscount = parseFloat((perUnitUtsavDiscount * quantity).toFixed(2));

  // 6) Compute the “selling portion” and “utsav portion” for tax:
  const sellingPortion = variant.unitPrice * quantity;
  const utsavPortion  = (typeof variant.utsavPrice === "number"
    ? variant.utsavPrice
    : variant.sellingPrice) * quantity;

  // 7) Subtotal (based on the price we’ll actually charge) = unitPriceToCharge × quantity
  const subtotal = parseFloat((unitPriceToCharge * quantity).toFixed(2));

  // 8) Compute totalBeforeShipping = sellingPortion
  let totalBeforeShipping = parseFloat(sellingPortion.toFixed(2));

  // 9) Determine shippingCost (flat per‐item shippingCost, but enforce ₹60 minimum if ≤ ₹499)
  let shippingCost = variant.shippingCost || 0;
  if (totalBeforeShipping <= 499) {
    shippingCost = Math.max(shippingCost, 60);
  }
  const totalWithShipping = parseFloat((totalBeforeShipping + shippingCost).toFixed(2));

  // 10) Compute “discount” field = totalBaseDiscount 
  //     (we no longer do subtotal – sellingPortion; instead use (unitPrice – sellingPrice)×qty)
  const discount = totalBaseDiscount;

  // 11) Compute “tax” on the sellingPortion:
  //     tax = (sellingPortion / (100 + taxPercent)) × taxPercent
  const tax = parseFloat(
    ((sellingPortion / (variant.taxPercent + 100)) * variant.taxPercent).toFixed(2)
  );

  // 12) Compute “utsavTax” on the utsavPortion:
  const utsavTax = parseFloat(
    ((utsavPortion / (variant.taxPercent + 100)) * variant.taxPercent).toFixed(2)
  );

  // 13) Compute “utsavTotal” = utsavPortion
  const utsavTotal = parseFloat(utsavPortion.toFixed(2));

  // 14) Compute cart‐level “utsavDiscount” = (totalWithShipping – utsavTotal)
  const utsavDiscount = parseFloat((totalWithShipping - utsavTotal).toFixed(2));

  // 15) Validate & apply coupon if provided:
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

    // Check minimum purchase on “sellingPortion”
    if (sellingPortion < coupon.Minimum_Purchase) {
      const err = new Error(
        `Coupon applies only on orders with subtotal ≥ ₹${coupon.Minimum_Purchase}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Apply percentage vs. flat coupon
    if (coupon.Discount_Type.toLowerCase() === "percentage") {
      couponDiscount = parseFloat(
        ((sellingPortion * coupon.Discount_Value) / 100).toFixed(2)
      );
    } else {
      couponDiscount = parseFloat(coupon.Discount_Value.toFixed(2));
    }

    // Cap couponDiscount so (totalWithShipping − totalUtsavDiscount) ≥ 0
    const maxAllowed = parseFloat((totalWithShipping - totalUtsavDiscount).toFixed(2));
    if (couponDiscount > maxAllowed) {
      couponDiscount = maxAllowed;
    }
  }

  // 16) Final total after all discounts:
  const finalTotal = parseFloat(
    (totalWithShipping - totalBaseDiscount - totalUtsavDiscount - couponDiscount).toFixed(2)
  );

  // 17) Determine payment methods:
  const paymentMethods = [
    {
      label:     "Wallet",
      method:    "Wallet",
      available: true,
      icon:      "mobile",
      image:     "https://finafid.com/image/mywallet.png",
    },
    {
      label:     "Card / UPI / Net Banking",
      method:    "PayU",
      available: true,
      icon:      "money",
      image:     "https://finafid.com/image/payumoney.png",
    },
    {
      label:     "Cash on Delivery",
      method:    "COD",
      available: variant.cod === true,
      icon:      "mobile",
      image:     "https://finafid.com/image/cod.jpg",
    },
  ];

  // 18) Build PriceDetails exactly like your frontend needs:
  const priceDetails = {
    subtotal:totalWithShipping,                           // unitPriceToCharge × quantity
    total: subtotal,           // sellingPortion + shipping
    discount: totalBaseDiscount,        // (unitPrice − sellingPrice) × quantity
    tax,                                // tax portion on sellingPortion
    shippingCost,                       // flat shipping (≥ ₹60 if needed)
    utsavTotal,                         // utsavPortion
    utsavDiscount: totalUtsavDiscount,  // (selling + shipping − utsavPortion)
  };

  return {
    variant: {
      ...variant,
      requestedQuantity: quantity,
    },
    pricing: priceDetails,
    couponDiscount,
    finalTotal,
    paymentMethods,
  };
}
module.exports = {
  getBuyNowPricing,
};
