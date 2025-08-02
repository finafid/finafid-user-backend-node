const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_BASE_URL = process.env.PAYU_BASE_URL;

const User = require("../../models/auth/userSchema");
const crypto = require("crypto");
const Order = require("../../models/Order/orderSc");
const NewOrder = require("../../models/Order/newOrder");
const {
  updateStatusDetails,
} = require("../../controllers/order/orderController");
const {
  removeItemFromCart,
  removeItemCart,
} = require("../../controllers/cartAndwishlist/cartWlController");
const Transaction = require("../../models/payment/paymentSc");
const Wallet = require("../../models/Wallet/wallet");
const walletTransaction = require("../../models/Wallet/WalletTransaction");

const { getSocketInstance } = require("../order/socket");
const { updateStatusv2, updateNewStatusv2 } = require("../order/orderControllerv2");
// Payment Request (Order or Wallet)
const paymentDetail = async (req, res) => {
  try {
    const { amount, orderId, type, paymentMode } = req.body; // Accept paymentMode
    const userDetails = await User.findById(req.user._id);

    if (!amount || !userDetails) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    let txnid, productinfo;

    if (type === "wallet") {
      txnid = `wallet_${req.user._id}_${Date.now()}`;
      productinfo = "Wallet Recharge";
    } else {
      const orderDetails = await Order.findById(orderId);
      if (!orderDetails) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      txnid = orderId;
      productinfo = "Order Payment";
    }

    const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${userDetails.fullName}|${userDetails.email}|||||||||||${PAYU_MERCHANT_SALT}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const paymentData = {
      key: PAYU_MERCHANT_KEY,
      txnid,
      amount,
      productinfo,
      firstname: userDetails.fullName,
      email: userDetails.email,
      phone: userDetails.phone.toString(),
      surl: "https://finafid.co.in/api/v1/success",
      furl: "https://finafid.co.in/api/v1/failure",
      hash,
      service_provider: "payu_paisa",
      enforce_paymethod: paymentMode === "PAYU_UPI" ? "UPI" : "CC",
      pg: paymentMode === "PAYU_UPI" ? "UPI" : "CC",
    };
    console.log(paymentMode)

    res.json({ paymentData, actionURL: `${PAYU_BASE_URL}/_payment` });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error: " + error.message });
  }
};

const newpaymentDetail = async (req, res) => {
  try {
    const { amount, orderId, type, paymentMode } = req.body; // Accept paymentMode
    const userDetails = await User.findById(req.user._id);

    if (!amount || !userDetails) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    let txnid, productinfo;

    if (type === "wallet") {
      txnid = `wallet_${req.user._id}_${Date.now()}`;
      productinfo = "Wallet Recharge";
    } else {
      const orderDetails = await NewOrder.findById(orderId);
      if (!orderDetails) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      txnid = orderId;
      productinfo = "Order Payment";
    }
    console.log("Payment Mode:", orderId);
    const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${userDetails.fullName}|${userDetails.email}|||||||||||${PAYU_MERCHANT_SALT}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const paymentData = {
      key: PAYU_MERCHANT_KEY,
      txnid,
      amount,
      productinfo,
      firstname: userDetails.fullName,
      email: userDetails.email,
      phone: userDetails.phone.toString(),
      surl: "https://finafid.co.in/api/v1/payusucessfull",
      furl: "https://finafid.co.in/api/v1/payufailed",
      hash,
      service_provider: "payu_paisa",
      enforce_paymethod: paymentMode === "PAYU_UPI" ? "UPI" : "CC",
      pg: paymentMode === "PAYU_UPI" ? "UPI" : "CC",
    };

    res.json({ paymentData, actionURL: `${PAYU_BASE_URL}/_payment` });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error: " + error.message });
  }
};

const addBalanceFromPayment = async (userId, amount, description) => {
  try {
    const type = "credit";
    const newTransaction = new walletTransaction({
      userId,
      type,
      amount: Number(amount),  // Ensure amount is a number
      date: Date.now(),
      transaction_message: description,
    });

    await newTransaction.save();
    let walletDetails = await Wallet.findOne({ userId });

    if (!walletDetails) {
      walletDetails = new Wallet({
        userId,
        balance: Number(amount),  // Ensure amount is a number
        transactions: [newTransaction],
      });
    } else {
      walletDetails.balance += Number(amount);  // Ensure addition works correctly
      walletDetails.transactions.push(newTransaction);
    }

    await walletDetails.save();
  } catch (error) {
    console.error("Error adding balance from payment:", error);
  }
};




// Payment Response Handler
const paymentResponse = async (req, res) => {
  try {
    const { txnid, status, amount, email, firstname, productinfo, hash } = req.body;

    if (!txnid || !status || !amount || !email || !firstname || !productinfo || !hash) {
      return res.status(400).send("Invalid payment data");
    }

    const hashString = `${PAYU_MERCHANT_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_MERCHANT_KEY}`;
    const generatedHash = crypto.createHash("sha512").update(hashString).digest("hex");

    if (generatedHash !== hash) {
      return res.status(400).send("Payment verification failed");
    }

    if (status === "success") {
      if (txnid.startsWith("wallet_")) {
        const userId = txnid.split("_")[1]; // Extract user ID from txnid
        const description = "Wallet Recharge Successful";
        await addBalanceFromPayment(userId, amount, description);
        return res.render("paymentSuccess");
      } else {
        const updatedOrder = await Order.findOneAndUpdate(
          { _id: txnid },
          { payment_complete: true, status: "Confirmed" }
        ).populate("orderItem");
        const io = getSocketInstance();
        io.emit("orderStatusUpdated", {
          orderId: updatedOrder._id,
          status: 'Confirmed',
        });

        if (!updatedOrder) {
          return res.status(400).send("Order not found");
        }

        await updateStatusDetails(updatedOrder._id, "Confirmed");
        await removeItemFromCart(updatedOrder.orderItem, updatedOrder.userId);

        return res.render("paymentSuccess");
      }
    } else {
      return res.render("paymentFailure");
    }
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
};


const payuResponse = async (req, res) => {
  try {
    const {
      txnid,
      status,
      amount,
      email,
      firstname,
      productinfo,
      hash
    } = req.body;

    if (!txnid || !status || !amount || !email || !firstname || !productinfo || !hash) {
      return res.status(400).send("Invalid payment data");
    }

    const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_MERCHANT_SALT}`;
const generatedHash = crypto.createHash("sha512").update(hashString).digest("hex");

    
    if (generatedHash !== hash) {
      return res.status(400).send("Payment verification failed");
    }

    if (status === "success") {
      const updatedOrder = await NewOrder.findOneAndUpdate({
        _id: txnid
      });

      if (!updatedOrder) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }

      updatedOrder.paymentInfo.isPaid = true;
      updatedOrder.paymentInfo.paymentStatus = "Completed";
      updatedOrder.paymentInfo.paidAt = new Date();
      updatedOrder.paymentInfo.gatewayResponse = null;
      await updatedOrder.save();
      await updateNewStatusv2(updatedOrder._id, "Confirmed");
      await removeItemCart(updatedOrder.orderItems, updatedOrder.userId);
      return res.render("paymentSuccess");
    } else {
      return res.render("paymentFailure");
    }

  } catch (error) {
    console.error("💥 Internal Server Error:", error);
    return res.status(500).send("Internal Server Error");
  }
};






// Handle Successful Order Payment
const handlePaymentSuccess = async (txnid, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: txnid },
      { payment_complete: true, status: "Confirmed" }
    ).populate({
      path: "orderItem.productId",
      model: "Variant",
      populate: {
        path: "productGroup",
        model: "Product",
      },
    });

    await updateStatusDetails(updatedOrder._id, "Confirmed");
    await removeItemFromCart(updatedOrder.orderItem, updatedOrder.userId);

    return res.render("paymentSuccess");
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
};

// Handle Payment Failure
const handlePaymentFailure = async (txnid, res) => {
  try {
    await Order.findOneAndUpdate({ _id: txnid }, { status: "Failed" });
    return res.render("paymentFailure");
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  paymentResponse,
  paymentDetail,
  handlePaymentSuccess,
  handlePaymentFailure,
  newpaymentDetail,
  payuResponse
};
