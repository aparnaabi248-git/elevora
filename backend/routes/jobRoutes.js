const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobDetails,
  createJob,
  updateJob,
  deleteJob,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getLinkedInMatchedJobs
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Student Specific routes (Must be declared before /:id)
router.get('/saved', protect, authorize('student'), getSavedJobs);
router.get('/linkedin-matched', protect, authorize('student'), getLinkedInMatchedJobs);

// Public routes
router.get('/', getJobs);
router.get('/:id', getJobDetails);

// Protected routes (Student Specific Action)
router.post('/:id/save', protect, authorize('student'), saveJob);
router.post('/:id/unsave', protect, authorize('student'), unsaveJob);

// Protected routes (Recruiter / Admin Specific)
router.post('/', protect, authorize('recruiter', 'admin'), createJob);
router.put('/:id', protect, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteJob);

module.exports = router;
