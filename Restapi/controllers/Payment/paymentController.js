const payment = "../../models/payment/paymentSc";
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpayIntance = new Razorpay({
  key_id: process.env.ROZERPAY_KEY_Id,
  key_secret: process.env.ROZERPAY_SECRET_ID,
});
const paymentDetails = async (req, res) => {
  const { amount, currency = "INR", orderId } = req.body;
  try {
    receiptId = "order_rcptid_" + Math.floor(Math.random() * 1000);
    const option = {
      amount: amount * 100,
      currency: currency,
      receipt: receiptId,
      payment_capture: 1,
    };
    const response = await razorpayIntance.orders.create(option);
    console.log("Payment Initiated:", response);
    if (!response) {
      return res.status(500).json({
        success: false,
        message: "No response",
      });
    }
    const newPaymentDetails = new payment({
      orderId: orderId,
      paymentId: receiptId,
      amount: amount,
      currency: currency,
      status: response.status,
    });
    await newPaymentDetails.save();
    res.send(newPaymentDetails);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error",
      err,
    });
  }
};


const verifySignature= async (req, res) => {
  try{
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const hmac = crypto.createHmac("sha256", "YOUR_RAZORPAY_KEY_SECRET");
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === razorpay_signature) {
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid signature",
    });
  }
}catch(error){
    return res.status(500).json({
      success: false,
      message: "error",
      err,
    });
}
};

module.exports = {
  paymentDetails,
  verifySignature,
};
