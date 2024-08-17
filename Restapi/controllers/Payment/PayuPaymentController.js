const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_BASE_URL = process.env.PAYU_BASE_URL;
const User = require("../../models/auth/userSchema");
const crypto = require("crypto");
const paymentDetail = async (req, res) => {
  try {
    console.log(req.body)
    console.log(PAYU_MERCHANT_KEY);
    console.log(PAYU_MERCHANT_SALT);
    const { amount, orderId } = req.body;
    const userDetails = await User.findById(req.user._id);
    const txnid = "" + orderId;
    const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|Order|${userDetails.fullName}|${userDetails.email}|||||||||||${PAYU_MERCHANT_SALT}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");
    console.log("Generated Hash: ", hash);
    const paymentData = {
      key: PAYU_MERCHANT_KEY,
      txnid: txnid,
      amount: amount,
      productinfo: "Order",
      firstname: userDetails.fullName,
      email: userDetails.email,
      phone: userDetails.phone.toString(),
      surl: "https://finafid.com/account/orders",
      furl: "https://finafid.com/account/orders",
      hash: hash,
      service_provider: "payu_paisa",
    };

    console.log("Payment Data: ", paymentData);

    res.json({ paymentData, actionURL: `${PAYU_BASE_URL}/_payment` });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

const paymentResponse = async (req, res) => {
  const hashString = `${PAYU_MERCHANT_SALT}|${req.body.paymentData.status}|||||||||||${req.body.paymentData.email}|${req.body.paymentData.firstname}|${req.body.paymentData.productinfo}|${req.body.paymentData.amount}|${req.body.paymentData.txnid}|${PAYU_MERCHANT_KEY}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");
  console.log({ hash: hash });
  if (hash === req.body.hash) {
    res.send("Payment successful");
  } else {
    res.send("Payment verification failed");
  }
};
module.exports = {
  paymentResponse,
  paymentDetail,
};
