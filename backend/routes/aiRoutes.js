const express = require('express');
const router = express.Router();
const {
  analyzeResume,
  chatWithMentor,
  getInterviewQuestions,
  generateCoverLetter,
  getResumeAnalysis
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect); // All AI endpoints require login
router.use(authorize('student')); // Only students can run AI career features

router.post('/analyze-resume', upload.single('resume'), analyzeResume);
router.get('/resume-analysis', getResumeAnalysis);
router.post('/chat', chatWithMentor);
router.post('/interview-prep', getInterviewQuestions);
router.post('/cover-letter', generateCoverLetter);

module.exports = router;
