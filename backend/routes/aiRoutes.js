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

// Wrap multer so file-filter / size errors return JSON with a stable code
// instead of falling through to the generic HTML error handler.
const handleResumeUpload = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          code: 'INVALID_RESUME_FILE',
          message: 'Resume file is too large. Please upload a file smaller than 10MB.'
        });
      }
      return res.status(err.status || 400).json({
        code: err.code || 'INVALID_RESUME_FILE',
        message: err.message || 'Invalid resume file. Only PDF, DOC, and DOCX files are allowed.'
      });
    }
    next();
  });
};

router.post('/analyze-resume', handleResumeUpload, analyzeResume);
router.get('/resume-analysis', getResumeAnalysis);
router.post('/chat', chatWithMentor);
router.post('/interview-prep', getInterviewQuestions);
router.post('/cover-letter', generateCoverLetter);

module.exports = router;
