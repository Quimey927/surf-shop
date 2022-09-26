const express = require('express');
const router = express.Router({ mergeParams: true });
const { asyncErrorHandler, isLoggedIn, isReviewAuthor } = require('../middleware/index');
const {
  reviewCreate,
  reviewUpdate,
  reviewDestroy } = require('../controllers/reviews');

/* POST reviews create /posts/:id/reviews */
router.post('/', asyncErrorHandler(reviewCreate));

/* PUT reviews update /posts/:id/reviews/:id */
router.put('/:review_id', isReviewAuthor, asyncErrorHandler(reviewUpdate));

/* DELETE reviews destroy /posts/:id/reviews/:review_id */
router.delete('/:review_id', isReviewAuthor, asyncErrorHandler(reviewDestroy));

module.exports = router;