const Review = require("../../models/product/ReviewAndRatings");
const getAllReviews = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      productId,
      userId,
    } = req.query;

    // Create a date filter object if startDate and endDate are provided
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to the endDate to include the entire day
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        dateFilter.createdAt.$lte = end;
      }
    }
    const allReviews = await Review.find(dateFilter);

    if (!allReviews) {
      return res.status(500).json({ message: "No customer" });
    }

    let filteredOrders = allReviews;
    if (status) {
      filteredOrders = allReviews.filter((order) => order.status === status);
    }
    let filtered = allReviews;
    if (productId) {
      filtered = allReviews.filter((order) => order.productId === productId);
    }
    let filteredBasedOnUser = allReviews;
    if (userId) {
      filteredBasedOnUser = allReviews.filter(
        (order) => order.userId === userId
      );
    }
    return res.status(200).json({ filteredBasedOnUser: filteredBasedOnUser });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
const reviewStatusUpdate = async (req, res) => {
  try {
    const reviewDetails = await Review.findById(req.params.reviewId);
    if (!reviewDetails) {
      return res.status(500).json({ message: "No such review" });
    }
    reviewDetails.status = req.body.status;
    await reviewDetails.save();
    return res.status(200).json({ reviewDetails: reviewDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message + " Internal Server Error" });
  }
};
module.exports = { getAllReviews, reviewStatusUpdate };
