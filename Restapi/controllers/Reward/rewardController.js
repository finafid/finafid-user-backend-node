const Reward = require("../../models/reward/Reward");
const RewardTransaction = require("../../models/reward/RewardTransaction");
const User = require("../../models/auth/userSchema");

// Get Total Reward Points of All Users
const getTotalRewards = async (req, res) => {
  try {
    const totalRewards = await Reward.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$points" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      totalPoints: totalRewards.length ? totalRewards[0].totalPoints : 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// Add Reward Points to User (User Action)
const addRewardPoints = async (req, res) => {
    try {
      const userId = req.user._id;
      let { points, description } = req.body;
  
      // Convert points to number to prevent concatenation issues
      points = Number(points);
  
      if (isNaN(points)) {
        return res.status(400).json({ success: false, message: "Points must be a valid number." });
      }
  
      const type = points > 0 ? "credit" : "debit";
  
      const newTransaction = new RewardTransaction({
        userId,
        type,
        points,
        transaction_message: description,
      });
  
      await newTransaction.save();
  
      let rewardDetails = await Reward.findOne({ userId });
  
      if (!rewardDetails) {
        rewardDetails = new Reward({ userId, points: 0, transactions: [] });
      }
  
      rewardDetails.points += points;  // Ensure numeric addition
      rewardDetails.transactions.push(newTransaction);
      await rewardDetails.save();
  
      res.status(200).json({ success: true, message: "Reward points added successfully", points: rewardDetails.points });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  };
  

// Show User's Reward Transactions
const showRewardTransactions = async (req, res) => {
  try {
    const rewardDetails = await Reward.findOne({ userId: req.user._id }).populate("transactions");

    if (!rewardDetails) {
      return res.status(400).json({ message: "No transactions found" });
    }

    return res.status(200).json({ message: "Transaction details", rewardDetails });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

// Get User's Reward Points Balance
const getRewardBalance = async (req, res) => {
  try {
    let rewardDetails = await Reward.findOne({ userId: req.user._id }).populate({
      path: "transactions",
      model: "RewardTransaction",
      options: { sort: { createdAt: -1 }, limit: 0 },
    });

    if (!rewardDetails) {
      rewardDetails = new Reward({
        userId: req.user._id,
        points: 0,
        transactions: [],
      });
      await rewardDetails.save();
    }

    return res.status(200).json({ rewardDetails });
  } catch (error) {
    res.status(500).json({ message: `${error.message} Internal Server Error` });
  }
};

// Add Reward Points from Admin
const addRewardFromAdmin = async (req, res) => {
    try {
      const { points, description, userId } = req.body;
  
      // Convert points to number
      const parsedPoints = Number(points);
  
      if (isNaN(parsedPoints)) {
        return res.status(400).json({ success: false, message: "Points must be a valid number." });
      }
  
      const type = parsedPoints > 0 ? "credit" : "debit";
  
      const newTransaction = new RewardTransaction({
        userId,
        type,
        points: parsedPoints,
        transaction_message: description,
      });
  
      await newTransaction.save();
  
      let rewardDetails = await Reward.findOne({ userId });
  
      if (!rewardDetails) {
        rewardDetails = new Reward({ userId, points: 0, transactions: [] });
      }
  
      rewardDetails.points += parsedPoints;  // Ensure numeric addition
      rewardDetails.transactions.push(newTransaction);
      await rewardDetails.save();
  
      res.status(200).json({ success: true, message: "Reward points added successfully", points: rewardDetails.points });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  };
  

// Get User's Reward Points Balance (Admin)
const getRewardBalanceFromAdmin = async (req, res) => {
  try {
    let rewardDetails = await Reward.findOne({ userId: req.params.userId }).populate({
      path: "transactions",
      model: "RewardTransaction",
      options: { limit: 0 },
    });

    if (!rewardDetails) {
      return res.status(400).json({ message: "No reward account found" });
    }

    return res.status(200).json({ rewardDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// Create Reward Wallet for All Users (One-Time)
const addRewardWallet = async (req, res) => {
  try {
    const userList = await User.find();

    userList.forEach(async (element) => {
      let rewardDetails = await Reward.findOne({ userId: element._id });

      if (!rewardDetails) {
        rewardDetails = new Reward({
          userId: element._id,
          points: 0,
          transactions: [],
        });
        await rewardDetails.save();
      }
    });

    return res.status(200).json({ message: "Done" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

module.exports = {
  addRewardPoints,
  showRewardTransactions,
  getRewardBalance,
  addRewardFromAdmin,
  getRewardBalanceFromAdmin,
  addRewardWallet,
  getTotalRewards,
};
