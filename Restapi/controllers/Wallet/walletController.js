const Wallet = require("../../models/Wallet/wallet");
const Transaction = require("./../../models/Wallet/WalletTransaction");
const addBalance = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you have user ID in req.user._id from authentication middleware
    const { amount} = req.body;
    const type = amount > 0 ? "credit" : "debit";

    const newTransaction = new Transaction({
      userId,
      type,
      amount,
      date: Date.now(),
    });
    await newTransaction.save();
    let walletDetails = await Wallet.findOne({ userId });

    if (!walletDetails) {
      // Create a new wallet if it doesn't exist
      walletDetails = new Wallet({
        userId,
        balance: amount,
        transactions: [newTransaction],
      });
    }

    // Add money to the wallet
    walletDetails.balance += amount;
    walletDetails.transactions.push(newTransaction);
    // Save the updated wallet
    await walletDetails.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Money added successfully",
        balance: walletDetails.balance,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
};
const showTransactions = async (req, res) => {
  try {
    const walletDetails = await Wallet.findOne({
      userId: req.user._id,
    }).populate("transactions");
    if (!walletDetails) {
      res.status(400).json({ message: "No transaction " });
    }
    res.status(200).json({ message: " Transaction details", walletDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getBalance = async (req, res) => {
  try {
    const walletDetails = await Wallet.findOne({
      userId: req.user._id,
    }).populate("transactions");
    if (!walletDetails) {
      return res
        .status(400)
        .json({ message: "Cannot find the wallet Details" });
    }
    return res.status(200).json({ walletDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
module.exports = {
  addBalance,
  showTransactions,
  getBalance,
};
