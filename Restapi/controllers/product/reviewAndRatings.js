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
        $facet: {
          averageRating: [
            {
              $group: {
                _id: "$productId",
                averageRating: { $avg: "$rating" },
                count: { $sum: 1 },
              },
            },
          ],
          ratingCounts: [
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const averageRating =
      result[0].averageRating.length > 0
        ? result[0].averageRating[0]
        : { averageRating: 0, count: 0 };

    // Initialize counts for ratings 1 to 5
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Populate actual counts
    result[0].ratingCounts.forEach((rc) => {
      ratingCounts[rc._id] = rc.count;
    });

    return res.status(200).json({
      averageRating: averageRating.averageRating,
      totalCount: averageRating.count,
      ratingCounts: ratingCounts,
    });
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
  getAvgRating,
};
