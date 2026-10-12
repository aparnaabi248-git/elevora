const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, syncLinkedInProfile } = require('../controllers/profileController');
const { protect, authorize } = require('../middleware/authMiddleware');

const Course = require('../models/Course');

router.use(protect); // All profile routes require token authentication

router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (error) {
    res.status(550).json({ message: 'Error loading courses' });
  }
});

router.post('/linkedin-sync', authorize('student'), syncLinkedInProfile);

router.route('/')
  .get(getUserProfile)
  .put(authorize('student'), updateUserProfile);

module.exports = router;
