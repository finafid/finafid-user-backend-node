const Review = require("../../models/product/Review&Ratings");
const {getImageLinks}=require("../../utils/fileUpload")
const createReview = async (req, res) => {
  let imgLink = "";
  if (req.files && req.files.length > 0) {
    imgLink = await getImageLinks(req.files);
  }
  const review = new Review({
    productId: req.params.productId,
    userId: req.user._id,
    rating: req.body.rating,
    comment: req.body.comment,
    title: req.body.title,
    imgLink
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
    const reviews = await Review.find({
      productId: req.params.productId,
    }).populate({path:"userId",
      model:"user"
    }

    );
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
const getAvgRating = async (req, res) => {
  try {
    const productId = req.params.productId;

    const result = await Review.aggregate([
      { $match: { productId: productId } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      return res
        .status(200)
        .json({ rating: result[0].averageRating, count: result[0].count });
    } else {
      return res.status(200).json({ rating: 0, count: 0 });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = getAvgRating;

module.exports = {
  createReview,
  GetAllReviews,
  reviewByID,
  updateReview,
  deleteReview,
  getAvgRating,
};
