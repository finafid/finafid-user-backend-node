const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_BASE_URL = process.env.PAYU_BASE_URL;

const User = require("../../models/auth/userSchema");
const crypto = require("crypto");
const Order=require("../../models/Order/orderSc")
const {
  updateStatusDetails,
} = require("../../controllers/order/orderController");
const {
  removeItemFromCart,
} = require("../../controllers/cartAndwishlist/cartWlController");
const paymentDetail = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    const orderDetails = await Order.findById(orderId);
    const userDetails = await User.findById(req.user._id);
    // const txnid = "" + orderDetails.transactionId;
    // console.log(orderDetails.transactionId);
    console.log(PAYU_BASE_URL);
     console.log(PAYU_MERCHANT_SALT);
      console.log(PAYU_MERCHANT_KEY);

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
      surl: "https://finafid-backend-node-e762fd401cc5.herokuapp.com/api/v1/paymentResponse",
      furl: "https://finafid-backend-node-e762fd401cc5.herokuapp.com/api/v1/paymentResponse",
      hash: hash,
      service_provider: "payu_paisa",
    };
    //https://finafid-backend-node-e762fd401cc5.herokuapp.com/api/v1/paymentResponse
    console.log("Payment Data: ", paymentData);

    res.json({ paymentData, actionURL: `${PAYU_BASE_URL}/_payment` });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const { ObjectId } = require("mongodb");
const paymentResponse = async (req, res) => {
  try {
    console.log("Processing PayU payment response...");

    // PayU typically sends the data in req.body directly, so adjust accordingly
    let { txnid, status, amount, email, firstname, productinfo, hash } =
      req.body;

    // Log the incoming payment data for debugging
    console.log(req.body);

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
          { payment_complete: true, status: "Confirmed" }
          // { new: true }
        ).populate("orderItem");
        console.log(updatedOrder);
        await updateStatusDetails(updatedOrder._id,"Confirmed");
        await removeItemFromCart(updatedOrder.orderItem, updatedOrder.userId);

        res.render("paymentSuccess");
      } else {
        // const updatedOrder = await Order.findOneAndUpdate(
        //   { _id: txnid },
        //   { status: "Failed" },
        //   { new: true }
        // );

        res.render("paymentFailure");
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
