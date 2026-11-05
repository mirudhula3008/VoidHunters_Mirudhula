const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createReview, getWorkerReviews, getBookingReview } = require('../controllers/reviewController');

const router = express.Router();

router.post('/', protect, authorize('customer'), upload.single('image'), createReview);
router.get('/worker/:id', getWorkerReviews);
router.get('/booking/:bookingId', protect, getBookingReview);

module.exports = router;
