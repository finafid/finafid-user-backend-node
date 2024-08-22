const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_BASE_URL = process.env.PAYU_BASE_URL;
const User = require("../../models/auth/userSchema");
const crypto = require("crypto");
const Order=require("../../models/Order/orderSc")
const paymentDetail = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    const orderDetails = await Order.findById(orderId);
    const userDetails = await User.findById(req.user._id);
    // const txnid = "" + orderDetails.transactionId;
    // console.log(orderDetails.transactionId);
     const txnid = "" + orderId;
    console.log(txnid);
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
      surl: "http://localhost:3000/api/v1/paymentResponse",
      furl: "http://localhost:3000/api/v1/paymentResponse",
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
  try {
    console.log("kedkjmfkem")
    const { txnid, status, amount, email, firstname, productinfo, hash } =
      req.body.paymentData;
    consol.log(req.body)
    if (
      !txnid ||
      !status ||
      !amount ||
      !email ||
      !firstname ||
      !productinfo ||
      !hash
    ) {
      return res.status(400).send("Invalid payment data");
    }

    const hashString = `${PAYU_MERCHANT_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_MERCHANT_KEY}`;
    const generatedHash = crypto
      .createHash("sha512")
      .update(hashString)
      .digest("hex");

    console.log({ generatedHash, receivedHash: hash });

    if (generatedHash === hash) {
      if (status === "success") {
        const updatedOrder = await Order.findOneAndUpdate(
          { _id: txnid },
          { payment_complete: true, status: "Confirmed" },
          { new: true }
        );

        res.render("paymentSuccess", { order: updatedOrder });
      } else {
        const updatedOrder = await Order.findOneAndUpdate(
          { _id: txnid },
          { status: "Failed" },
          { new: true }
        );

        res.render("paymentFailure", { order: updatedOrder });
      }
    } else {
      res.status(400).send("Payment verification failed");
    }
  } catch (error) {
    console.error("Error processing payment response:", error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {
  paymentResponse,
  paymentDetail,
};
