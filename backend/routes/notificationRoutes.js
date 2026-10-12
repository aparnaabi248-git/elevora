const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All notifications require auth

router.get('/', getNotifications);

// Mark all as read (Must be declared before /:id/read)
router.put('/read-all', markAllAsRead);

// Mark single as read
router.put('/:id/read', markAsRead);

module.exports = router;
