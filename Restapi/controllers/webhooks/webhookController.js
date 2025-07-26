const mongoose = require("mongoose");
const Order = require("../../models/Order/orderSc"); // Your order model
const orderStatusModel = require("../../models/Order/OrderStatus"); // Order status history model
const { getSocketInstance } = require("../../socket");
const sendSms = require("./smsService");
const { verifyPayUSignature } = require("../../utils/verifyPayUSignature");

const PAYU_SECRET_KEY = process.env.PAYU_SECRET_KEY;

/**
 * Helper to add status history entry
 */
async function addOrderStatusHistory(orderId, status, note = "") {
  let statusDetails = await orderStatusModel.findOne({ orderId });
  const statusEntry = { status, updatedAt: new Date(), note };

  if (!statusDetails) {
    statusDetails = new orderStatusModel({
      orderId,
      orderStatusDetails: [statusEntry],
    });
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

    // Find order using your internal orderId (string) which corresponds to txnid
    // Change if you use another field for matching:
    const orderDetail = await Order.findOne({ orderId: txnid }).populate("userId");

    if (!orderDetail) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let newOrderStatus = orderDetail.status; // default keep current status

    // Normalize paymentStatus to lowercase for consistent comparison
    const normalizedPaymentStatus = paymentStatus ? paymentStatus.toLowerCase() : "";

    // Handle payment success cases
    if (event === "payment_success" || normalizedPaymentStatus === "success" || normalizedPaymentStatus === "completed") {
      orderDetail.payment_complete = true;
      orderDetail.updatedAt = new Date();

      // It's helpful to store mihpayid as PayU payment reference if you want
      orderDetail.transactionId = mihpayid ? mongoose.Types.ObjectId.isValid(mihpayid) ? mongoose.Types.ObjectId(mihpayid) : orderDetail.transactionId : orderDetail.transactionId;

      newOrderStatus = "Confirmed";
      orderDetail.status = newOrderStatus;
    } 
    // Handle payment failure cases
    else if (event === "payment_failure" || normalizedPaymentStatus === "failure" || normalizedPaymentStatus === "failed") {
      orderDetail.payment_complete = false;

      newOrderStatus = "Failed"; // Your schema enum uses "Failed" (not "Payment Failed")
      orderDetail.status = newOrderStatus;
    } 
    // Other cases, keep status as is

    await orderDetail.save();

    // Add to order status history
    await addOrderStatusHistory(
      orderDetail._id,
      newOrderStatus,
      `Updated via PayU webhook event: ${event || paymentStatus}`
    );

    // Emit socket event to notify frontend
    const io = getSocketInstance();
    io.emit("orderStatusUpdated", { orderId: orderDetail._id, status: newOrderStatus });

    // Send confirmation SMS on successful payment
    if (newOrderStatus === "Confirmed" && orderDetail.userId) {
      if (orderDetail.userId.is_Active && !orderDetail.userId.blocking) {
        await sendSms("messageForOrderConfirmed", {
          phoneNumber: orderDetail.userId.phone,
          totalOrder: orderDetail.totalPrice || 0,
          itemName: orderDetail.orderId,
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
