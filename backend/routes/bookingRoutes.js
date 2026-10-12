const express = require('express');
const router = express.Router();
const {
  getConsultants,
  getBookings,
  createBooking,
  chatWithConsultant,
  updateScratchpad,
  completeBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All booking routes require authentication

router.get('/consultants', getConsultants);
router.get('/', getBookings);
router.post('/', createBooking);
router.post('/:id/chat', chatWithConsultant);
router.put('/:id/scratchpad', updateScratchpad);
router.post('/:id/complete', completeBooking);

module.exports = router;
