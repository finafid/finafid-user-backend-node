// utils/priceCalculator.js

/**
 * Returns { subtotal, tax, unitTaxPortion, totalBeforeDiscounts }
 *
 * @param {Object} params
 * @param {Number} params.sellingPrice   – per-unit price (₹)
 * @param {Number} params.quantity       – how many units
 * @param {String} params.taxModel       – "exclude" or "include"
 * @param {Number} params.taxPercent     – e.g. 18 for 18%
 * @param {Number} params.shippingCost   – flat shipping per order (₹)
 */
function calculateLineItemPrice({
  sellingPrice,
  quantity,
  taxModel,
  taxPercent,
  shippingCost,
}) {
  // 1) Subtotal = unitPrice × quantity
  const subtotal = parseFloat((sellingPrice * quantity).toFixed(2));

  // 2) Determine tax & unitTaxPortion
  let tax = 0;
  let unitTaxPortion = 0;
  if (taxPercent > 0) {
    if (taxModel === "exclude") {
      // Tax on top of subtotal
      tax = parseFloat((subtotal * (taxPercent / 100)).toFixed(2));
      unitTaxPortion = parseFloat(((sellingPrice * (taxPercent / 100)).toFixed(2)));
    } else {
      // Tax is included in sellingPrice → back it out
      const basePricePerUnit = sellingPrice * (100 / (100 + taxPercent));
      const taxPortionPerUnit = sellingPrice - basePricePerUnit;
      unitTaxPortion = parseFloat(taxPortionPerUnit.toFixed(2));
      tax = parseFloat((taxPortionPerUnit * quantity).toFixed(2));
    }
  }

  // 3) totalBeforeDiscounts = subtotal + (tax if exclude) + shippingCost
  const totalBeforeDiscounts = parseFloat(
    (
      subtotal +
      (taxModel === "exclude" ? tax : 0) +
      shippingCost
    ).toFixed(2)
  );

  return {
    subtotal,
    tax,
    unitTaxPortion,
    totalBeforeDiscounts,
  };
}

module.exports = {
  calculateLineItemPrice,
};
