const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const order = require("../../models/Order/orderSc");
const User = require("../../models/auth/userSchema");
const { getSocketInstance } = require("../../socket");
const sendOrderConfirmationEmail = require("./emailService").sendOrderConfirmationEmail;
const sendSms = require("./smsService");
const orderStatus = require("../../models/Order/OrderStatus");
const { verifyPayUSignature } = require("../../utils/verifyPayUSignature");

const PAYU_SECRET_KEY = process.env.PAYU_SECRET_KEY;

/**
 * Helper to add status history entry
 */
async function addOrderStatusHistory(orderId, status, note = "") {
  let statusDetails = await orderStatus.findOne({ orderId });
  const statusEntry = { status, updatedAt: new Date(), note };

  if (!statusDetails) {
    statusDetails = new orderStatus({ orderId, orderStatusDetails: [statusEntry] });
  } else {
    statusDetails.orderStatusDetails.push(statusEntry);
  }
  await statusDetails.save();
}

/**
 * PayU Webhook - Update payment status and order accordingly
 */
const updatePaymentStatusPayU = async (req, res) => {
  try {
    const signature = req.headers["x-pay-signature"];

    // Verify signature first
    if (!verifyPayUSignature(req.body, signature, PAYU_SECRET_KEY)) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Extract relevant fields from webhook payload
    const { txnid, mihpayid, status: paymentStatus, event } = req.body;

    if (!txnid) {
      return res.status(400).json({ success: false, message: "Missing order identifier (txnid)" });
    }

    // Find order using orderNumber (adjust if you use _id or different field)
    const orderDetail = await order.findOne({ orderNumber: txnid }).populate("userId");
    if (!orderDetail) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let newOrderStatus = orderDetail.orderStatus; // default keep current status

    // Map events and status to order updates
    if (event === "payment_success" || paymentStatus === "success" || paymentStatus === "Completed") {
      orderDetail.paymentInfo.paymentStatus = "Completed";
      orderDetail.paymentInfo.isPaid = true;
      orderDetail.paymentInfo.paidAt = new Date();
      orderDetail.paymentInfo.transactionId = mihpayid || orderDetail.paymentInfo.transactionId;

      newOrderStatus = "Confirmed";
      orderDetail.orderStatus = newOrderStatus;
    } else if (event === "payment_failure" || paymentStatus === "failure" || paymentStatus === "Failed") {
      orderDetail.paymentInfo.paymentStatus = "Failed";
      orderDetail.paymentInfo.isPaid = false;

      newOrderStatus = "Payment Failed";
      orderDetail.orderStatus = newOrderStatus;
    } else {
      // For other event/status types, you can log or handle later
      newOrderStatus = orderDetail.orderStatus;
    }

    await orderDetail.save();

    // Add to order status history
    await addOrderStatusHistory(orderDetail._id, newOrderStatus, `Updated via PayU webhook event: ${event || paymentStatus}`);

    // Emit socket event to notify frontend
    const io = getSocketInstance();
    io.emit("orderStatusUpdated", { orderId: orderDetail._id, status: newOrderStatus });

    // Send confirmation email & SMS on successful payment
    if (newOrderStatus === "Confirmed" && orderDetail.userId) {
      await sendOrderConfirmationEmail(orderDetail, orderDetail.userId);

      if (orderDetail.userId.is_Active && !orderDetail.userId.blocking) {
        await sendSms("messageForOrderConfirmed", {
          phoneNumber: orderDetail.userId.phone,
          totalOrder: orderDetail.pricing?.totalPrice || 0,
          itemName: orderDetail.orderNumber,
        });
      }
    }

    return res.status(200).json({ success: true, message: "Payment status updated successfully", order: orderDetail });
  } catch (err) {
    console.error("Error in PayU webhook payment update:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  updatePaymentStatusPayU,
};
