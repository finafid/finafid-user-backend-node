const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_KEY;
const PAYU_BASE_URL = process.env.PAYU_MERCHANT_KEY;
const User=require("../../models/auth/userSchema")

const paymentDetails = async (req, res) => {
 try {
   const { amount, productInfo, orderId } = req.body;
   const userDetails = await User.findById(req.user._id);
   const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${userDetails.fullName}|${userDetails.email}|||||||||||${PAYU_MERCHANT_SALT}`;
   const hash = crypto.createHash("sha512").update(hashString).digest("hex");

   const paymentData = {
     key: PAYU_MERCHANT_KEY,
     txnid: orderId,
     amount: amount,
     productinfo: productInfo,
     firstname: userDetails.fullName,
     email: userDetails.email,
     phone: userDetails.phone,
     surl: "http://yourdomain.com/success",
     furl: "http://yourdomain.com/failure",
     hash: hash,
     service_provider: "payu_paisa",
   };

   res.json({ paymentData, action: `${PAYU_BASE_URL}/_payment` });
 } catch (error) {
   res.status(500).json({ message: error.message + " Internal Server Error" });
 }
};

const paymentResponse = async (req, res) => {
  const hashString = `${PAYU_MERCHANT_SALT}|${req.body.status}|||||||||||${req.body.email}|${req.body.firstname}|${req.body.productinfo}|${req.body.amount}|${req.body.txnid}|${PAYU_MERCHANT_KEY}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  if (hash === req.body.hash) {
    res.send("Payment successful");
  } else {
    res.send("Payment verification failed");
  }
};
module.exports = {
  paymentResponse,
  paymentDetails,
};
