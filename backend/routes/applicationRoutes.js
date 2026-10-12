const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // All application routes require authentication

router.route('/')
  .post(authorize('student'), applyToJob)
  .get(getApplications);

router.patch('/:id/status', authorize('recruiter', 'admin'), updateApplicationStatus);

module.exports = router;
