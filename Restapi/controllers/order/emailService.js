const path = require("path");
const fs = require("fs");
const {
  sendMail,
  oneMinuteExpiry,
  threeMinuteExpiry,
} = require("../../utils/mailer"); // Ensure you have sendMail function available in your project

async function sendOrderConfirmationEmail(orderDetail, userData) {
  try {
    const templatePath = path.join(__dirname, "orderconfirm.html");
    const htmlTemplate = await fs.promises.readFile(templatePath, "utf8");

    const orderItemsHTML = orderDetail.orderItem
      .map(
        (item) =>
          `<tr>
            <td align="left" valign="top" style="padding: 16px 0px 8px 16px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr><td><table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr><td valign="top"><table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr><th valign="top" style="font-weight: normal; text-align: left;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr><td valign="top" style="padding: 0px 20px 0px 0px;">
                <img src="${item?.productId?.images[0]}" width="100" height="104" alt="" style="display: block; width:100px; height:104px; border: 0;" />
                </td></tr></table></th>
                <th valign="top" style="font-weight: normal; text-align: left;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr><td valign="top">
                <div style="font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; color: #001942; font-weight: 600;">
                  ${item.productId.name} - Qty: ${item.itemQuantity}
                </div>
                </td></tr></table></th></tr></table></td></tr></table></td>
            </tr></table></td>
            <td align="right" valign="top" style="padding: 24px 16px;">
              <div style="font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; color: #001942;">
                ${item?.productId?.sellingPrice}
              </div>
            </td>
          </tr>`
      )
      .join("");

    const emailHTML = htmlTemplate
      .replace("{{customerName}}", orderDetail.address.customerName)
      .replace("{{orderId}}", orderDetail._id)
      .replace("{{orderItems}}", orderItemsHTML)
      .replace("{{subtotal}}", orderDetail.subtotal)
      .replace("{{discount}}", orderDetail.discount)
      .replace("{{utsavDiscount}}", orderDetail.utsavDiscount)
      .replace("{{couponDiscount}}", orderDetail.couponDiscount)
      .replace("{{tax}}", orderDetail.tax.toFixed(2))
      .replace("{{shippingCost}}", orderDetail.shippingCost)
      .replace("{{address}}", `${orderDetail.address.locality} ${orderDetail.address.state} ${orderDetail.address.pinCode}`)
      .replace("{{receiverName}}", orderDetail.address.receiverName)
      .replace("{{receiverPhone}}", orderDetail.address.receiverPhone)
      .replace("{{_id}}", orderDetail._id)
      .replace("{{totalPrice}}", orderDetail.totalPrice);

    await sendMail(userData.email, "Order Confirmation", emailHTML);
     // console.log("Order confirmation email sent");
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
  }
}
async function sendOrderConfirmEmail(orderDetail, userData) {
 try {
    const templatePath = path.join(__dirname, "orderconfirm.html");
    const htmlTemplate = await fs.promises.readFile(templatePath, "utf8");

    // Map your order items to HTML rows
    const orderItemsHTML = orderDetail.orderItems
      .map(
        (item) =>
          `<tr>
              <td style="padding: 8px;">
                <img src="${item?.variantId?.images?.[0] || ''}" alt="${item?.variantId?.name || ''}" class="item-img" />
              </td>
              <td style="padding: 8px;">
                <div class="item-name">${item?.variantId?.name || "Product Name"} - Qty: ${item.quantity}</div>
              </td>
              <td style="padding: 8px;" class="price">₹${item.sellingPrice * item.quantity}</td>
          </tr>`
      )
      .join("");

    // Use a helper function to safely replace all placeholders
    const replaceAllPlaceholders = (template, data) => {
      return Object.entries(data).reduce(
        (acc, [key, value]) =>
          acc.replace(new RegExp(`{{${key}}}`, "g"), value !== undefined ? value : ""),
        template
      );
    };

    // Prepare data to inject
    const templateData = {
      customerName: orderDetail.address?.customerName || userData?.fullName || "Customer",
      orderId: orderDetail._id,
      orderItems: orderItemsHTML,
      subtotal: orderDetail.pricing?.itemsPrice || orderDetail.subtotal || 0,
      discount: orderDetail.pricing?.discountPrice || orderDetail.discount || 0,
      utsavDiscount: orderDetail.pricing?.utsavDiscount || orderDetail.utsavDiscount || 0,
      couponDiscount: orderDetail.pricing?.couponDiscount || orderDetail.couponDiscount || 0,
      tax: orderDetail.pricing?.taxPrice?.toFixed(2) || (orderDetail.tax || 0).toFixed(2),
      shippingCost: orderDetail.pricing?.shippingPrice || orderDetail.shippingCost || 0,
      address:
        `${orderDetail.address?.addressLine1 || ''} ${orderDetail.address?.addressLine2 || ''}, ${orderDetail.address?.city || ''}, ${orderDetail.address?.state || ''} ${orderDetail.address?.postalCode || ''}`.trim(),
      receiverName: orderDetail.address?.fullName || "",
      receiverPhone: orderDetail.address?.phoneNumber || "",
      totalPrice: orderDetail.pricing?.totalPrice || orderDetail.totalPrice || 0,
    };

    // Inject data into the HTML template
    const emailHTML = replaceAllPlaceholders(htmlTemplate, templateData);

    await sendMail(userData.email, "Order Confirmation", emailHTML);
    // console.log('Order confirmation email sent');
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
  }
}
module.exports = {sendOrderConfirmationEmail,sendOrderConfirmEmail};
