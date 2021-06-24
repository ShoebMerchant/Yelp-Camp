const express = require("express");
const router = express.Router({ mergeParams: true });
const { reviewSchema } = require("../schemas");

const reviews = require("../controllers/reviews");

const ExpressError = require("../utils/ExpressError");
const catchAsync = require("../utils/catchAsync");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware");

router.post("/", validateReview, isLoggedIn, catchAsync(reviews.createReview));

router.delete(
  "/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  catchAsync(reviews.deleteReview)
);

module.exports = router;
