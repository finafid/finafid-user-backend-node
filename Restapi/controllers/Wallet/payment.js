const mongoose = require("mongoose");
const Wallet = require("../../models/Wallet/wallet");
const Transaction = require("../../models/Wallet/WalletTransaction");
const Order = require("../../models/Order");

const payWithWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { orderId, amount } = req.body;

    // Fetch user's wallet with a lock for update
    let walletDetails = await Wallet.findOne({ userId }).session(session);

    if (!walletDetails || walletDetails.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // Deduct balance
    walletDetails.balance -= amount;

    // Create a transaction record
    const newTransaction = await Transaction.create(
      [
        {
          userId,
          type: "debit",
          amount,
          date: Date.now(),
          transaction_message: `Payment for Order ID: ${orderId}`,
        },
      ],
      { session }
    );

    walletDetails.transactions.push(newTransaction[0]._id);
    await walletDetails.save({ session });

    // Update order status
    await Order.findByIdAndUpdate(orderId, { status: "Paid" }, { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      transactionId: newTransaction[0]._id,
      remainingBalance: walletDetails.balance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  payWithWallet,
};
