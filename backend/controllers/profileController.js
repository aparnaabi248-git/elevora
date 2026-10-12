const User = require('../models/User');
const Notification = require('../models/Notification');
const { extractLinkedInProfileWithAI } = require('../services/geminiService');

/**
 * @desc    Get current user profile
 * @route   GET /api/profile
 * @access  Private (Student/Recruiter/Admin)
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Update student profile details
 * @route   PUT /api/profile
 * @access  Private (Student)
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    if (user.role !== 'student') {
      return res.status(400).json({ message: 'Profile editing is only available for students' });
    }

    const { skills, education, experience, certifications } = req.body;

    // Update fields if provided
    if (skills !== undefined) user.skills = skills;
    if (education !== undefined) user.education = education;
    if (experience !== undefined) user.experience = experience;
    if (certifications !== undefined) user.certifications = certifications;

    // Recalculate profile completion percentage
    user.calculateProfileCompletion();

    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Analyze user-provided LinkedIn profile text with AI
 * @route   POST /api/profile/linkedin-sync
 * @access  Private (Student)
 */
const syncLinkedInProfile = async (req, res) => {
  try {
    const { linkedinUrl, rawProfileText } = req.body;

    if (!rawProfileText?.trim()) {
      return res.status(400).json({
        message: 'Paste LinkedIn profile text to analyze. A URL alone cannot be imported automatically.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const cleanUrl = linkedinUrl || user.linkedinUrl || '';
    if (!cleanUrl) {
      return res.status(400).json({ message: 'Please provide your LinkedIn profile URL.' });
    }
    const parsedProfile = await extractLinkedInProfileWithAI(rawProfileText.trim());
    const extractedSkills = parsedProfile.skills;

    const mergedSkills = Array.from(new Set([...(user.skills || []), ...extractedSkills]));

    if (cleanUrl) user.linkedinUrl = cleanUrl;
    user.linkedinHeadline = parsedProfile.headline || user.linkedinHeadline;
    user.headline = user.linkedinHeadline || user.headline;
    user.bio = parsedProfile.bio || user.bio;
    user.linkedinConnected = true;
    user.linkedinLastSynced = new Date();
    user.skills = mergedSkills;

    user.calculateProfileCompletion();
    await user.save();

    await Notification.create({
      recipient: user._id,
      title: 'LinkedIn Profile Analyzed',
      message: `Gemini analyzed the profile text you provided and extracted ${extractedSkills.length} skills.`,
      type: 'success'
    });

    const updatedUser = await User.findById(user._id).select('-password');
    res.json({
      message: 'LinkedIn profile text analyzed successfully with AI',
      user: updatedUser
    });
  } catch (error) {
    console.error('LinkedIn sync error:', error.message);
    const status = error.status || 500;
    res.status(status).json({
      message: error.status === 503
        ? error.message
        : error.status === 502
          ? 'AI could not analyze this profile. Please try again.'
          : 'Failed to analyze this profile.'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  syncLinkedInProfile
};
