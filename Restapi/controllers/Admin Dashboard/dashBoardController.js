const order = require("../../models/Order/orderSc");
const User = require("../../models/auth/userSchema");
const totalIncome = async (req, res) => {
  try {
    // Get current date and set to start and end of the day
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    // Create dates for the previous day
    const startDateYesterday = new Date(startDate);
    startDateYesterday.setDate(startDate.getDate() - 1);
    const endDateYesterday = new Date(endDate);
    endDateYesterday.setDate(endDate.getDate() - 1);

    // Find orders within today's date range
    const orderDetailsOfToday = await order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      status: "Complete",
    });

    // Find orders within yesterday's date range
    const orderDetailsOfYesterDay = await order.find({
      createdAt: {
        $gte: startDateYesterday,
        $lte: endDateYesterday,
      },
      status: "Complete",
    });

    if (!orderDetailsOfToday || !orderDetailsOfYesterDay) {
      return res
        .status(500)
        .json({ message: "No order is completed till date" });
    }

    // Calculate total income for today
    const totalIncomeOfTheDay = orderDetailsOfToday.reduce(
      (acc, order) => acc + order.totalPrice,
      0
    );

    // Calculate total income for yesterday
    const totalIncomeOfPreviousDay = orderDetailsOfYesterDay.reduce(
      (acc, order) => acc + order.totalPrice,
      0
    );

    // Calculate percentage change
    const percentageChange =
      totalIncomeOfPreviousDay === 0
        ? 0
        : ((totalIncomeOfTheDay - totalIncomeOfPreviousDay) /
            totalIncomeOfPreviousDay) *
          100;

    return res.status(200).json({
      totalIncome: totalIncomeOfTheDay,
      percentageChange: percentageChange.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

const totalOrder = async (req, res) => {
  try {
    // Get current date and set to start and end of the day
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    // Create dates for the previous day
    const startDateYesterday = new Date(startDate);
    startDateYesterday.setDate(startDate.getDate() - 1);
    const endDateYesterday = new Date(endDate);
    endDateYesterday.setDate(endDate.getDate() - 1);

    // Find orders within today's date range
    const orderDetailsOfToday = await order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      status: "Complete",
    });

    // Find orders within yesterday's date range
    const orderDetailsOfYesterDay = await order.find({
      createdAt: {
        $gte: startDateYesterday,
        $lte: endDateYesterday,
      },
      status: "Complete",
    });

    if (!orderDetailsOfToday || !orderDetailsOfYesterDay) {
      return res
        .status(500)
        .json({ message: "No order is completed till date" });
    }

    const orderCountOfToday = orderDetailsOfToday.length;
    const orderCountOfPreviousDay = orderDetailsOfYesterDay.length;
    const changeInPercentage =
      ((orderCountOfToday - orderCountOfPreviousDay) /
        orderCountOfPreviousDay) *
      100;
    return res.status(200).json({
      orderCount: orderCountOfToday,
      changeInPercentage: changeInPercentage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

const productSold = async (req, res) => {
  try {
    // Get current date and set to start and end of the day
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    // Create dates for the previous day
    const startDateYesterday = new Date(startDate);
    startDateYesterday.setDate(startDate.getDate() - 1);
    const endDateYesterday = new Date(endDate);
    endDateYesterday.setDate(endDate.getDate() - 1);

    // Find orders within today's date range
    const orderDetailsOfToday = await order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      status: "Complete",
    });

    // Find orders within yesterday's date range
    const orderDetailsOfYesterDay = await order.find({
      createdAt: {
        $gte: startDateYesterday,
        $lte: endDateYesterday,
      },
      status: "Complete",
    });

    if (!orderDetailsOfToday || !orderDetailsOfYesterDay) {
      return res
        .status(500)
        .json({ message: "No order is completed till date" });
    }

    const totalProductSoldToday = orderDetailsOfToday.reduce((acc, order) => {
      const orderQuantity = order.orderItem.reduce(
        (sum, item) => sum + item.itemQuantity,
        0
      );
      return acc + orderQuantity;
    }, 0);
    const totalProductSoldYesterDay = orderDetailsOfYesterDay.reduce(
      (acc, order) => {
        const orderQuantity = order.orderItem.reduce(
          (sum, item) => sum + item.itemQuantity,
          0
        );
        return acc + orderQuantity;
      },
      0
    );
    const percentageChange =
      ((totalProductSoldToday - totalProductSoldYesterDay) /
        totalProductSoldYesterDay) *
      100;
    return res.status(200).json({
      totalProductSold: totalProductSoldToday,
      percentageChange: percentageChange,
    
    });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const totalUser = async (req, res) => {
  try {
    const userDetails = await User.find({
      status: "Active",
    });
    if (!userDetails) {
      return res
        .status(500)
        .json({ message: " no order is completed till date" });
    }
    const userCount = userDetails.length;
    return res.status(200).json({ userCount: userCount });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const orderAnalysis = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const incomeAnalysis = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};
const getUserOrderCount = async (req, res) => {
  try {
    const orderDetails = await order.find({
      status: "completed",
    });

    if (!orderDetails || orderDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No order is completed till date" });
    }

    // Create a map to count orders for each userId
    const userOrderMap = orderDetails.reduce((acc, order) => {
      acc[order.userId] = (acc[order.userId] || 0) + 1;
      return acc;
    }, {});

    // Convert the map to an array for sorting
    const sortedUserOrders = Object.entries(userOrderMap)
      .map(([userId, orderCount]) => ({ userId, orderCount }))
      .sort((a, b) => b.orderCount - a.orderCount);

    return res.status(200).json({ sortedUserOrders });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};

const topSellingProduct = async (req, res) => {
  try {
    const orderDetails = await order.find({
      status: "completed",
    });
    if (!orderDetails) {
      return res
        .status(500)
        .json({ message: " no order is completed till date" });
    }
    const customerAndOrderMap = orderDetails.reduce((acc, value) => {
      const productDetails = value.orderItem;
      const productCount = productDetails.reduce((acc, value) => {
        acc[value.productId] = (acc[value.itemQuantity] || 0) + 1;
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message + " Internal Server Error" });
  }
};

module.exports = {
  totalIncome,
  totalOrder,
  productSold,
  totalUser,
  orderAnalysis,
  incomeAnalysis,
  getUserOrderCount,
  topSellingProduct,
};
