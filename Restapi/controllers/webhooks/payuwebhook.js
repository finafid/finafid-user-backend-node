const mongoose = require("mongoose");
const Order = require("../../models/Order/orderSc");

const PAYU_SECRET_KEY = process.env.PAYU_SECRET_KEY;

const updatePaymentStatusPayU = async (req, res) => {
  try {
    

    const { txnid, status: paymentStatus, event,mihpayid } = req.body;
    if (!txnid) {
      return res.status(400).json({ success: false, message: "Missing txnid" });
    }

    const order = await Order.findOne({ _id: mihpayid });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const normalizedStatus = (paymentStatus || "").toLowerCase();
    if (event === "payment_success" || normalizedStatus === "success" || normalizedStatus === "completed") {
      order.payment_complete = true;
      order.status = "Confirmed";
    } else if (event === "payment_failure" || normalizedStatus === "failure" || normalizedStatus === "failed") {
      order.payment_complete = false;
      order.status = "Failed";
    } else {
      // For other payment states, do not update
      return res.status(200).json({ success: true, message: "No status change needed", order });
    }

    await order.save();

    return res.status(200).json({ success: true, message: "Payment status updated", order });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { updatePaymentStatusPayU };
