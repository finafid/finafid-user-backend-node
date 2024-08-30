const Transaction = require("../../models/payment/paymentSc");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../../models/Order/orderSc");
const razorpayIntance = new Razorpay({
  key_id: process.env.ROZERPAY_KEY_Id,
  key_secret: process.env.ROZERPAY_SECRET_ID,
});
const paymentDetails = async (req, res) => {
  try {
    const { amount, currency, orderId } = req.body;

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: currency,
      receipt: `receipt_${Math.floor(Math.random() * 1000000)}`,
    };

    const order = await razorpayIntance.orders.create(options);
    console.log(order);
    const newTransaction = new Transaction({
      orderId,
      razorpay_orderId: order.id,
      userId: req.user._id,
      amount,
      currency,
    });
    console.log(newTransaction);
    if (!newTransaction){
      res.status(500).json({
        success: false,
        message: "No newTransaction",
      });
  }
     await newTransaction.save();
    res.status(201).json({
      success: true,
      order,
      message: "Order created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifySignature = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const hmac = crypto.createHmac("sha256", process.env.ROZERPAY_SECRET_ID);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");
    const transactionDetails = await Transaction.findOne({
      razorpay_orderId: razorpay_order_id,
    });
    // const orderDetails = await Order.findById(transactionDetails.orderId);
    // orderDetails.transactionId = transactionDetails._id;
    // await orderDetails.save();
    transactionDetails.razorpay_payment_id = razorpay_payment_id;
    await transactionDetails.save();
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  paymentDetails,
  verifySignature,
};
