const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Company = require('../models/Company');
const ResumeAnalysis = require('../models/ResumeAnalysis');

/**
 * @desc    Get platform stats
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
const getAdminStats = async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const recruiterCount = await User.countDocuments({ role: 'recruiter' });
    const jobCount = await Job.countDocuments({});
    const applicationCount = await Application.countDocuments({});
    const companyCount = await Company.countDocuments({});

    res.json({
      students: studentCount,
      recruiters: recruiterCount,
      jobs: jobCount,
      applications: applicationCount,
      companies: companyCount
    });
  } catch (error) {
    console.error('Get admin stats error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    List all users
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Delete a user and their associated data
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Do not allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const userId = user._id;

    // Clean up student data
    if (user.role === 'student') {
      await ResumeAnalysis.deleteOne({ user: userId });
      await Application.deleteMany({ student: userId });
    }

    // Clean up recruiter data
    if (user.role === 'recruiter') {
      // Find company
      const company = await Company.findOne({ recruiter: userId });
      if (company) {
        // Remove recruiter link or delete company
        await Company.deleteOne({ _id: company._id });
        // Set other users company reference to null if any
        await User.updateMany({ company: company._id }, { $set: { company: null } });
      }
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser
};
