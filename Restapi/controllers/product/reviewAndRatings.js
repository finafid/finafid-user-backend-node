const Review = require("../../models/product/Review&Ratings");
const createReview = async (req, res) => {
  const review = new Review({
    productId: req.body.productId,
    userId: req.body.userId,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  try {
    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all reviews for a product
const GetAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const reviewByID = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (review == null) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (review == null) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (req.body.rating != null) {
      review.rating = req.body.rating;
    }
    if (req.body.comment != null) {
      review.comment = req.body.comment;
    }

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (review == null) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.remove();
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createReview,
  GetAllReviews,
  reviewByID,
  updateReview,
  deleteReview,
};
