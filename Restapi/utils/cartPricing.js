// utils/cartPricing.js

/**
 * @typedef {Object} CartItem
 * @property {Object} productId
 * @property {number} productId.unitPrice     - Base unit price before any discount
 * @property {number} productId.sellingPrice  - Actual selling price per unit
 * @property {number} productId.taxPercent    - e.g. 18 for 18%
 * @property {number} [productId.utsavPrice]  - Utsav‐member price per unit (if defined)
 * @property {number} [productId.shippingCost] - Flat shipping cost for this item (if any)
 * @property {number} itemQuantity            - Quantity of this variant in cart
 *
 * @typedef {Object} PriceDetails
 * @property {number} subtotal       - ∑(unitPrice × itemQuantity)
 * @property {number} total          - ∑(sellingPrice × itemQuantity) + shipping (with ₹60 minimum if ≤ ₹499)
 * @property {number} discount       - (unitPrice − sellingPrice) × itemQuantity
 * @property {number} tax            - total tax portion on sellingPrice
 * @property {number} utsavTax       - total tax portion on utsavPrice
 * @property {number} shippingCost   - total shipping (with ₹60 min if needed)
 * @property {number} utsavTotal     - ∑(utsavPrice × itemQuantity)
 * @property {number} utsavDiscount  - (totalWithShipping − utsavTotal)
 */

/**
 * Computes exactly the same fields your frontend was computing, but for a list of items.
 *
 * @param {CartItem[]} items
 * @param {boolean} [isUtsavUser=false]
 * @returns {PriceDetails}
 */
function calculatePrices(items, isUtsavUser = false) {
  // 1) Compute subtotal = ∑(unitPrice × quantity)
  const subtotal = items.reduce(
    (sum, item) => sum + item.productId.unitPrice * item.itemQuantity,
    0
  );

  // 2) Compute totalBeforeShipping = ∑(sellingPrice × quantity)
  let totalBeforeShipping = items.reduce(
    (sum, item) => sum + item.productId.sellingPrice * item.itemQuantity,
    0
  );

  // 3) Compute “discount” = ∑((unitPrice − sellingPrice) × quantity)
  const discount = parseFloat(
    items
      .reduce((sum, item) => {
        const perUnit = item.productId.unitPrice - item.productId.sellingPrice;
        return sum + perUnit * item.itemQuantity;
      }, 0)
      .toFixed(2)
  );

  // 4) Compute tax (on sellingPrice portions)
  const tax = parseFloat(
    items
      .reduce((sum, item) => {
        const sellingPortion = item.productId.sellingPrice * item.itemQuantity;
        const taxPortion =
          (sellingPortion / (item.productId.taxPercent + 100)) *
          item.productId.taxPercent;
        return sum + taxPortion;
      }, 0)
      .toFixed(2)
  );

  // 5) Compute utsavTax (on utsavPrice portions)
  const utsavTax = parseFloat(
    items
      .reduce((sum, item) => {
        const priceForTax =
          (typeof item.productId.utsavPrice === "number"
            ? item.productId.utsavPrice
            : item.productId.sellingPrice) * item.itemQuantity;
        const taxPortion = (priceForTax / (item.productId.taxPercent + 100)) *
          item.productId.taxPercent;
        return sum + taxPortion;
      }, 0)
      .toFixed(2)
  );

  // 6) Compute shippingCost = ∑(shippingCost” for each item),
  //    but if totalBeforeShipping ≤ 499, impose a minimum of ₹60.
  let shippingCost = parseFloat(
    items
      .reduce((sum, item) => sum + (item.productId.shippingCost || 0), 0)
      .toFixed(2)
  );
  if (totalBeforeShipping <= 499) {
    shippingCost = Math.max(shippingCost, 60);
  }

  // 7) Compute total = totalBeforeShipping + shippingCost
  const total = parseFloat((totalBeforeShipping + shippingCost).toFixed(2));

  // 8) Compute utsavTotal = ∑(utsavPrice or fallback to sellingPrice × quantity)
  const utsavTotal = parseFloat(
    items
      .reduce((sum, item) => {
        const priceForUtsav = typeof item.productId.utsavPrice === "number"
          ? item.productId.utsavPrice
          : item.productId.sellingPrice;
        return sum + priceForUtsav * item.itemQuantity;
      }, 0)
      .toFixed(2)
  );

  // 9) Compute utsavDiscount = total − utsavTotal
  const utsavDiscount = parseFloat((total - utsavTotal).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    total,
    discount,
    tax,
    utsavTax,
    shippingCost,
    utsavTotal,
    utsavDiscount,
  };
}

/**
 * Given a PriceDetails object and additional reductions (couponDiscount, rewardDeduction),
 * returns the final amount (≥ 0).
 *
 * @param {Object} priceDetails
 * @param {boolean} isUtsavUser
 * @param {number} [couponDiscount=0]
 * @param {number} [rewardDeduction=0]
 * @returns {number}
 */
function calculateFinalAmount(
  priceDetails,
  isUtsavUser,
  couponDiscount = 0,
  rewardDeduction = 0
) {
  let finalAmount = isUtsavUser ? priceDetails.utsavTotal : priceDetails.total;
  finalAmount = parseFloat((finalAmount - couponDiscount).toFixed(2));
  finalAmount = parseFloat((finalAmount - rewardDeduction).toFixed(2));
  return Math.max(finalAmount, 0);
}

module.exports = {
  calculatePrices,
  calculateFinalAmount,
};
