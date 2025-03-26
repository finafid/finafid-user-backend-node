const Wallet = require("../../models/Wallet/wallet");
const Transaction = require("./../../models/Wallet/WalletTransaction");
const User = require("../../models/auth/userSchema");
const amounts = ["100", "200", "300", "500"];
const getTotalBalance = async (req, res) => {
  try {
    const totalBalance = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      totalBalance: totalBalance.length ? totalBalance[0].totalBalance : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const addBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, description } = req.body;
    const type = amount > 0 ? "credit" : "debit";
    console.log(req.body)
    const newTransaction = new Transaction({
      userId,
      type,
      amount,
      date: Date.now(),
      transaction_message: description,
    });
    await newTransaction.save();
    let walletDetails = await Wallet.findOne({ userId });
    if (!walletDetails) {
      walletDetails = new Wallet({
        userId,
        balance: amount,
        transactions: [newTransaction],
      });
    }
    walletDetails.balance += amount;
    walletDetails.transactions.push(newTransaction);
    await walletDetails.save();

    res.status(200).json({
      success: true,
      message: "Money added successfully",
      balance: walletDetails.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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
      return res.status(400).json({ message: "No transaction " });
    }
    return res
      .status(200)
      .json({ message: " Transaction details", walletDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getBalance = async (req, res) => {
  try {
    let walletDetails = await Wallet.findOne({ userId: req.user._id }).populate({
      path: "transactions",
      model: "walletTransaction",
      options: {
        sort: { createdAt: -1 }, // Sort by createdAt in descending order
        limit: 0, // Ensure no limit is applied
      },
    });    
    console.log(walletDetails);
    if (!walletDetails) {
      walletDetails = new Wallet({
        userId: req.user._id,
        balance: 0,
        transactions: [],
      });
      await walletDetails.save();
    }

    console.log(
      `Number of transactions found: ${walletDetails.transactions.length}`
    );
    return res.status(200).json({ walletDetails });
  } catch (error) {
    // Error handling
    res.status(500).json({ message: `${error.message} Internal Server Error` });
  }
};
const addBalanceFromAdmin = async (req, res) => {
  try {
    const { amount, description, userId } = req.body;
    const type = amount > 0 ? "credit" : "debit";
    console.log(req.body);
    const newTransaction = new Transaction({
      userId,
      type,
      amount,
      date: Date.now(),
      transaction_message: description,
    });
    await newTransaction.save();
    let walletDetails = await Wallet.findOne({ userId });

    if (!walletDetails) {
      // Create a new wallet if it doesn't exist
      walletDetails = new Wallet({
        userId,
        balance: parseInt(amount),
        transactions: [newTransaction],
      });
    }
    console.log(walletDetails);
    walletDetails.balance += parseInt(amount);
    walletDetails.transactions.push(newTransaction);
    await walletDetails.save();

    res.status(200).json({
      success: true,
      message: "Money added successfully",
      balance: walletDetails.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getBalanceFromAdmin = async (req, res) => {
  try {
    let walletDetails = await Wallet.findOne({
      userId: req.params.userId,
    }).populate({
      path: "transactions",
      model: "walletTransaction",
      options: { limit: 0 },
    });
    if (!walletDetails) {
      return res.status(400).json({ message: "No wallet present" });
    }
    return res.status(200).json({ walletDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const addWallet = async (req, res) => {
  try {
    const userList = await User.find();
    userList.forEach(async (element) => {
      let walletDetails = await Wallet.findOne({
        userId: element._id,
      });
     console.log(walletDetails);
      if (!walletDetails) {
        walletDetails = new Wallet({
          userId: element._id,
          balance: 0,
          transactions: [],
        });
        await walletDetails.save();
      }
    });
    return res.status(200).json({
      message:"Done"
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getAmounts = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      amounts: amounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


module.exports = {
  addBalance,
  showTransactions,
  getBalance,
  addBalanceFromAdmin,
  getBalanceFromAdmin,
  addWallet,
  getTotalBalance,
  getAmounts
};
