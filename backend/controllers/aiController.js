const fs = require('fs');
const path = require('path');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const User = require('../models/User');
const Notification = require('../models/Notification');
const {
  extractTextFromResumeFile,
  analyzeResumeWithAI,
  getAIChatResponse,
  getAIInterviewQuestions,
  getAICoverLetter
} = require('../services/geminiService');

/**
 * Map a service error (which carries .status/.code) to a user-friendly
 * JSON response. Never leak raw SDK errors or API keys to the client,
 * and never fabricate analysis data when Gemini fails.
 */
const mapAIErrorToResponse = (error, fallbackMessage) => {
  const code = error.code || 'AI_FAILED';
  const status = error.status || 500;

  switch (code) {
    case 'GEMINI_OVERLOADED':
      return {
        status: 503,
        body: {
          code,
          message: 'The AI service is still overloaded after several attempts. Please try again in a few minutes.'
        }
      };
    case 'GEMINI_RATE_LIMITED':
      return {
        status: 429,
        body: {
          code,
          message: 'Too many AI requests right now. Please wait a minute and try again.'
        }
      };
    case 'GEMINI_AUTH':
      return {
        status: 500,
        body: {
          code,
          message: 'The AI service is misconfigured (invalid API key). Please contact support.'
        }
      };
    case 'GEMINI_MODEL_NOT_FOUND':
      return {
        status: 500,
        body: {
          code,
          message: error.message || 'The configured AI model is unsupported. Please contact support.'
        }
      };
    case 'GEMINI_MODEL_MISCONFIGURED':
      return {
        status: 500,
        body: {
          code,
          message: 'The AI model is misconfigured on the server. Please contact support.'
        }
      };
    case 'GEMINI_NOT_CONFIGURED':
      return {
        status: 500,
        body: {
          code,
          message: 'The AI service is not configured. Please contact support.'
        }
      };
    case 'GEMINI_INVALID_RESPONSE':
      return {
        status: 502,
        body: {
          code,
          message: 'The AI service returned an unexpected response. Please try again.'
        }
      };
    case 'GEMINI_INVALID_REQUEST':
      return {
        status: 400,
        body: {
          code,
          message: error.message || 'The AI service rejected this request. Try a different file or shorter input.'
        }
      };
    case 'INVALID_RESUME_FILE':
      return {
        status: 400,
        body: {
          code,
          message: error.message || 'Invalid resume file. Please upload a valid PDF or DOCX resume.'
        }
      };
    default:
      return {
        status,
        body: {
          code,
          message: fallbackMessage || 'AI service failed to process this request. Please try again.'
        }
      };
  }
};

const cleanupUploadedFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`Failed to clean up temp upload ${filePath}:`, err.message);
    }
  });
};

/**
 * @desc    Upload and analyze resume
 * @route   POST /api/ai/analyze-resume
 * @access  Private (Student)
 */
const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 'INVALID_RESUME_FILE',
        message: 'Please upload a PDF, DOC, or DOCX resume file.'
      });
    }

    console.log(`Uploaded resume: name="${req.file.originalname}" ext="${ext}" size=${req.file.size} bytes`);

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.pdf', '.doc', '.docx'].includes(ext)) {
      cleanupUploadedFile(req.file.path);
      return res.status(400).json({
        code: 'INVALID_RESUME_FILE',
        message: 'Only PDF, DOC, and DOCX files are allowed. Please upload a valid resume file.'
      });
    }

    // Legacy .doc has no reliable serverless parser — fail fast with guidance.
    if (ext === '.doc') {
      cleanupUploadedFile(req.file.path);
      return res.status(400).json({
        code: 'INVALID_RESUME_FILE',
        message: 'Legacy .doc files are not supported. Please convert your resume to PDF or DOCX and upload again.'
      });
    }

    // 1. Extract text from the uploaded resume (PDF/DOCX/TXT dispatch).
    let resumeText = '';
    try {
      resumeText = await extractTextFromResumeFile(req.file.path, req.file.originalname);
    } catch (err) {
      cleanupUploadedFile(req.file.path);
      const mapped = mapAIErrorToResponse(err);
      return res.status(mapped.status).json(mapped.body);
    }

    // 2. Analyze text using Gemini Service (log size only, never contents)
    console.log(`Sending resume to Gemini AI parser: ${resumeText.length} chars...`);
    if (!resumeText || !resumeText.trim()) {
      cleanupUploadedFile(req.file.path);
      return res.status(400).json({
        code: 'INVALID_RESUME_FILE',
        message: 'No readable text was found in this resume. If it is a scanned image, please upload a text-based PDF or DOCX.'
      });
    }

    let analysisResult;
    try {
      analysisResult = await analyzeResumeWithAI(resumeText);
      console.log(`Resume analysis succeeded: score=${analysisResult.resumeScore}`);
    } catch (err) {
      // Do not persist anything or return fake analysis when Gemini fails.
      cleanupUploadedFile(req.file.path);
      const mapped = mapAIErrorToResponse(err, 'AI service failed to analyze this resume. Please try again.');
      return res.status(mapped.status).json(mapped.body);
    }

    // Temp file is no longer needed after successful extraction.
    // The DB stores a /uploads/<filename> reference; on Vercel /tmp is
    // ephemeral, so resumeUrl is best-effort and never required for analysis.
    cleanupUploadedFile(req.file.path);

    // 3. Create serving URL reference for resume file
    const resumeUrl = `/uploads/${req.file.filename}`;

    // 4. Update or Create ResumeAnalysis entry in DB
    const analysisDoc = await ResumeAnalysis.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        resumeUrl,
        extractedInfo: analysisResult.extractedInfo,
        resumeScore: analysisResult.resumeScore,
        feedback: analysisResult.feedback,
        careerSuggestions: analysisResult.careerSuggestions,
        learningRoadmap: analysisResult.learningRoadmap
      },
      { new: true, upsert: true, runValidators: true }
    );

    // 5. Update user skills, resume URL, resume score, and profile completion
    const user = await User.findById(req.user._id);
    user.resumeUrl = resumeUrl;
    user.resumeScore = analysisResult.resumeScore;

    // Merge extracted skills into student profile if there are new ones
    if (analysisResult.extractedInfo && analysisResult.extractedInfo.skills) {
      const mergedSkills = new Set([...user.skills, ...analysisResult.extractedInfo.skills]);
      user.skills = Array.from(mergedSkills);
    }

    // Merge extracted education if empty
    if (user.education.length === 0 && analysisResult.extractedInfo.education) {
      user.education = analysisResult.extractedInfo.education
        .filter(ed => ed.school?.trim() && ed.degree?.trim() && ed.fieldOfStudy?.trim())
        .map(ed => ({
          school: ed.school,
          degree: ed.degree,
          fieldOfStudy: ed.fieldOfStudy
        }));
    }

    // Merge extracted experience if empty
    if (user.experience.length === 0 && analysisResult.extractedInfo.experience) {
      user.experience = analysisResult.extractedInfo.experience
        .filter(exp => exp.company?.trim() && exp.role?.trim())
        .map(exp => ({
          company: exp.company,
          role: exp.role,
          description: exp.description || ''
        }));
    }

    user.calculateProfileCompletion();
    await user.save();

    // 6. Create success notification
    await Notification.create({
      recipient: req.user._id,
      title: 'Resume Analyzed Successfully!',
      message: `Your resume scored ${analysisResult.resumeScore}/100. We have updated your profile skills and generated a career roadmap.`,
      type: 'success'
    });

    res.json(analysisDoc);
  } catch (error) {
    console.error(
      `Analyze resume controller error: code=${error.code || 'UNKNOWN'} status=${error.status || 500} upstream=${error.upstreamStatus ?? '?'} attempts=${error.attempts || 1}`
    );
    if (req.file?.path) cleanupUploadedFile(req.file.path);
    const mapped = mapAIErrorToResponse(error, 'Internal Server Error');
    res.status(mapped.status).json(mapped.body);
  }
};

/**
 * @desc    Chat with career mentor
 * @route   POST /api/ai/chat
 * @access  Private (Student)
 */
const chatWithMentor = async (req, res) => {
  const { message, history } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Please provide a message' });
    }

    const aiResponse = await getAIChatResponse(history, message);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat controller error:', error.code || error.message);
    const mapped = mapAIErrorToResponse(error, 'AI service failed to generate a response. Please try again.');
    res.status(mapped.status).json(mapped.body);
  }
};

/**
 * @desc    Generate AI interview prep questions
 * @route   POST /api/ai/interview-prep
 * @access  Private (Student)
 */
const getInterviewQuestions = async (req, res) => {
  const { jobTitle, jobDescription } = req.body;

  try {
    if (!jobTitle || !jobDescription) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Please provide jobTitle and jobDescription' });
    }

    const user = await User.findById(req.user._id);
    const skills = user.skills || [];

    console.log(`Generating interview questions for job: "${jobTitle}"`);
    const questions = await getAIInterviewQuestions(jobTitle, jobDescription, skills);
    res.json(questions);
  } catch (error) {
    console.error('Interview prep controller error:', error.code || error.message);
    const mapped = mapAIErrorToResponse(error, 'AI service failed to generate a response. Please try again.');
    res.status(mapped.status).json(mapped.body);
  }
};

/**
 * @desc    Generate a custom cover letter
 * @route   POST /api/ai/cover-letter
 * @access  Private (Student)
 */
const generateCoverLetter = async (req, res) => {
  const { jobTitle, companyName, jobDescription } = req.body;

  try {
    if (!jobTitle || !companyName || !jobDescription) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Please provide jobTitle, companyName and jobDescription' });
    }

    const user = await User.findById(req.user._id);
    const studentProfile = {
      name: user.name,
      skills: user.skills || [],
      education: user.education || [],
      experience: user.experience || []
    };

    console.log(`Generating cover letter for job: "${jobTitle}" at "${companyName}"`);
    const coverLetter = await getAICoverLetter(jobTitle, companyName, jobDescription, studentProfile);
    res.json({ coverLetter });
  } catch (error) {
    console.error('Cover letter controller error:', error.code || error.message);
    const mapped = mapAIErrorToResponse(error, 'AI service failed to generate a response. Please try again.');
    res.status(mapped.status).json(mapped.body);
  }
};

/**
 * @desc    Get current user's resume analysis details
 * @route   GET /api/ai/resume-analysis
 * @access  Private (Student)
 */
const getResumeAnalysis = async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({ user: req.user._id });
    if (!analysis) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'No resume analysis found. Please upload your resume first.' });
    }
    res.json(analysis);
  } catch (error) {
    console.error('Get resume analysis error:', error.message);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Internal Server Error' });
  }
};

module.exports = {
  analyzeResume,
  chatWithMentor,
  getInterviewQuestions,
  generateCoverLetter,
  getResumeAnalysis,
  mapAIErrorToResponse
};
