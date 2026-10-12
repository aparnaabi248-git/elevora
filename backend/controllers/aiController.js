const ResumeAnalysis = require('../models/ResumeAnalysis');
const User = require('../models/User');
const Notification = require('../models/Notification');
const {
  extractTextFromPDF,
  analyzeResumeWithAI,
  getAIChatResponse,
  getAIInterviewQuestions,
  getAICoverLetter
} = require('../services/geminiService');

/**
 * @desc    Upload and analyze resume
 * @route   POST /api/ai/analyze-resume
 * @access  Private (Student)
 */
const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF resume file' });
    }

    console.log(`Uploaded file: ${req.file.originalname} saved at ${req.file.path}`);
    
    // 1. Extract text from PDF
    let resumeText = '';
    try {
      resumeText = await extractTextFromPDF(req.file.path);
    } catch (err) {
      return res.status(400).json({ message: 'Could not extract text from this PDF file. Make sure it is not corrupted or scanned image only.' });
    }

    // 2. Analyze text using Gemini Service
    console.log('Sending resume text to Gemini AI parser...');
    if (!resumeText.trim()) {
      return res.status(400).json({ message: 'No readable text was found in this PDF resume.' });
    }
    const analysisResult = await analyzeResumeWithAI(resumeText);

    // 3. Create serving URL for resume file
    // Example: http://localhost:5000/uploads/file-123456.pdf
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
    console.error('Analyze resume controller error:', error.message);
    const status = error.status || 500;
    res.status(status).json({
      message: error.status === 503
        ? error.message
        : error.status === 502
          ? 'AI service failed to analyze this resume. Please try again.'
          : 'Internal Server Error'
    });
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
      return res.status(400).json({ message: 'Please provide a message' });
    }

    const aiResponse = await getAIChatResponse(history, message);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat controller error:', error.message);
    const status = error.status || 502;
    res.status(status).json({
      message: error.status === 503 ? error.message : 'AI service failed to generate a response. Please try again.'
    });
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
      return res.status(400).json({ message: 'Please provide jobTitle and jobDescription' });
    }

    const user = await User.findById(req.user._id);
    const skills = user.skills || [];

    console.log(`Generating interview questions for job: "${jobTitle}"`);
    const questions = await getAIInterviewQuestions(jobTitle, jobDescription, skills);
    res.json(questions);
  } catch (error) {
    console.error('Interview prep controller error:', error.message);
    const status = error.status || 502;
    res.status(status).json({
      message: error.status === 503 ? error.message : 'AI service failed to generate a response. Please try again.'
    });
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
      return res.status(400).json({ message: 'Please provide jobTitle, companyName and jobDescription' });
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
    console.error('Cover letter controller error:', error.message);
    const status = error.status || 502;
    res.status(status).json({
      message: error.status === 503 ? error.message : 'AI service failed to generate a response. Please try again.'
    });
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
      return res.status(404).json({ message: 'No resume analysis found. Please upload your resume first.' });
    }
    res.json(analysis);
  } catch (error) {
    console.error('Get resume analysis error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  analyzeResume,
  chatWithMentor,
  getInterviewQuestions,
  generateCoverLetter,
  getResumeAnalysis
};
