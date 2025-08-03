const Wallet = require("../../models/Wallet/wallet");
const Transaction = require("./../../models/Wallet/WalletTransaction");
const User = require("../../models/auth/userSchema");
const amounts = ["100", "200", "300", "500"];
const bcrypt = require("bcrypt");
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
const setWalletPin = async (req, res) => {
  try {
    const userId = req.user._id;       // assume req.user is set by your auth middleware
    const { pin, securityQuestion, securityAnswer } = req.body;

    // 1) Validate inputs:
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: "PIN must be exactly 4 digits."
      });
    }
    if (!securityQuestion || typeof securityQuestion !== "string" || securityQuestion.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Security question is required."
      });
    }
    if (!securityAnswer || typeof securityAnswer !== "string" || securityAnswer.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Security answer is required."
      });
    }

    // 2) Fetch (or create) the user’s Wallet:
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
    }

    // 3) Prevent overwriting if PIN already exists:
    if (wallet.pinHash) {
      return res.status(400).json({
        success: false,
        message: "PIN already set. Use 'change PIN' or 'reset PIN' instead."
      });
    }

    // 4) Hash the PIN and the security answer:
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(pin, saltRounds);
    const answerHash = await bcrypt.hash(securityAnswer.trim(), saltRounds);

    // 5) Save to wallet:
    wallet.pinHash = pinHash;
    wallet.isPinRequired = true;
    wallet.securityQuestion = securityQuestion.trim();
    wallet.securityAnswerHash = answerHash;

    await wallet.save();

    return res.json({
      success: true,
      message: "Wallet PIN and security question set successfully."
    });
  } catch (err) {
    console.error("setWalletPin error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
}
const resetPin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { securityAnswer, newPin } = req.body;

    // 1) Validate inputs
    if (!securityAnswer || typeof securityAnswer !== "string" || securityAnswer.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "securityAnswer is required." });
    }
    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return res
        .status(400)
        .json({ success: false, message: "newPin must be exactly 4 digits." });
    }

    // 2) Find wallet record
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || !wallet.securityAnswerHash) {
      return res.status(404).json({
        success: false,
        message: "No security question set or wallet not found."
      });
    }

    // 3) Verify the provided answer
    const isAnswerMatch = await bcrypt.compare(
      securityAnswer.trim(),
      wallet.securityAnswerHash
    );
    if (!isAnswerMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect security answer." });
    }

    // 4) At this point, user is authenticated by answering the question.
    //    Hash the new PIN and save:
    const saltRounds = 10;
    const newPinHash = await bcrypt.hash(newPin, saltRounds);
    wallet.pinHash = newPinHash;

    // Optionally, you could clear the security question/answer to force them to set a new one:
    // wallet.securityQuestion = undefined;
    // wallet.securityAnswerHash = undefined;

    await wallet.save();

    return res.json({
      success: true,
      message: "Your PIN has been reset successfully."
    });
  } catch (err) {
    console.error("resetViaSecurityQuestion error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
}
const changeWalletPin = async (req, res) =>{
  try {
    const userId = req.user._id;    // assume req.user is populated by your auth middleware
    const { oldPin, newPin } = req.body;

    // 1) Validate inputs
    if (!oldPin || !/^\d{4}$/.test(oldPin)) {
      return res.status(400).json({
        success: false,
        message: "Current PIN (oldPin) is required and must be 4 digits."
      });
    }
    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: "New PIN is required and must be 4 digits."
      });
    }
    if (oldPin === newPin) {
      return res.status(400).json({
        success: false,
        message: "New PIN must be different from the current PIN."
      });
    }

    // 2) Fetch the user’s Wallet document
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "No wallet found for this user."
      });
    }

    // 3) Ensure a PIN is already set; if not, disallow overwrite
    if (!wallet.pinHash) {
      return res.status(400).json({
        success: false,
        message: "No existing PIN found. Use 'set PIN' endpoint to create a new PIN first."
      });
    }

    // 4) Compare oldPin against stored hash
    const isMatch = await bcrypt.compare(oldPin, wallet.pinHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current PIN is incorrect."
      });
    }

    // 5) Hash and save the newPin
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPin, saltRounds);
    wallet.pinHash = newHash;
    await wallet.save();

    return res.json({
      success: true,
      message: "Wallet PIN changed successfully."
    });
  } catch (err) {
    console.error("changeWalletPin error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
} 
const getResetQuestion = async (req, res) =>{
  try {
    const userId = req.user._id;
    const wallet = await Wallet.findOne({ userId }).lean();

    if (!wallet || !wallet.securityQuestion) {
      return res.status(404).json({
        success: false,
        message: "No security question set for this user."
      });
    }

    return res.json({
      success: true,
      securityQuestion: wallet.securityQuestion
    });
  } catch (err) {
    console.error("getSecurityQuestion error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
}

const getPinRequirement = async (req, res) => {
  try {
    const userId = req.user._id;
    const wallet = await Wallet.findOne({ userId });
    return res.json({ 
      isPinRequired: wallet?.isPinRequired || false,
      hasPin: !!wallet?.pinHash
    });
  } catch (err) {
    console.error('getPinRequired error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};


const updatePinRequirement = async (req, res, next) => {
  try {
    const { isPinRequired } = req.body;
    if (typeof isPinRequired !== 'boolean') {
      return res.status(400).json({ success: false, message: '`isPinRequired` must be boolean' });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id },
      { isPinRequired },
      { new: true }
    );
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    res.json({ success: true, isPinRequired: wallet.isPinRequired });
  } catch (err) {
    next(err);
  }
};

const getWalletTransactionsByDate = async (req, res) => {
  try {
    const userId = req.user._id;
    let { startDate, endDate, page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    // Find the user's wallet
    const walletDetails = await Wallet.findOne({ userId });
    if (!walletDetails) {
      return res.status(404).json({ success: false, message: "Wallet not found." });
    }

    // Build filter for Transaction find query
    const filter = {
      _id: { $in: walletDetails.transactions }, 
    };

    if (startDate) {
      startDate = new Date(startDate);
      startDate.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      endDate = new Date(endDate);
      endDate.setHours(23, 59, 59, 999);
    }

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }

    // Query transactions with pagination
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })  // Assuming your transaction model uses ‘date’ field for timestamp
      .skip(skip)
      .limit(limit);

    const totalTransactions = await Transaction.countDocuments(filter);

    if (!transactions.length) {
      return res.status(404).json({ success: false, message: "No transactions found." });
    }

    return res.status(200).json({
      success: true,
      message: `Transactions${startDate ? " from " + startDate.toISOString() : ""}${endDate ? " to " + endDate.toISOString() : ""}`,
      page,
      limit,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit),
      transactions,
    });

  } catch (error) {
    console.error("getWalletTransactionsByDate error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    let walletDetails = await Wallet.findOne({ userId });
    
    if (!walletDetails) {
      // Create wallet if not exists
      walletDetails = new Wallet({
        userId,
        balance: 0,
        transactions: [],
      });
      await walletDetails.save();
    }

    return res.status(200).json({
      success: true,
      balance: walletDetails.balance,
    });
  } catch (error) {
    console.error("getWalletBalance error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
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
  getAmounts,
  setWalletPin,
  resetPin,
  changeWalletPin,
  getResetQuestion,
  getPinRequirement,
  updatePinRequirement,
  getWalletBalance,
  getWalletTransactionsByDate
};
