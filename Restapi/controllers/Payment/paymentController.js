const payment = "../../models/payment/paymentSc";
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpayIntance = new Razorpay({
  key_id: process.env.ROZERPAY_KEY_Id,
  key_secret: process.env.ROZERPAY_SECRET_ID,
});
const paymentDetails = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: currency,
      receipt: `receipt_${Math.floor(Math.random() * 1000000)}`,
    };

    const order = await razorpayIntance.orders.create(options);
    console.log(order);
    
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


const verifySignature= async (req, res) => {
  try{
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
    console.log(req.body);
  const hmac = crypto.createHmac("sha256", process.env.ROZERPAY_SECRET_ID);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest("hex");
    console.log(generatedSignature);
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
      message: error.message,
    });
}
};

module.exports = {
  paymentDetails,
  verifySignature,
};
