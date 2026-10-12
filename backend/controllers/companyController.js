const Company = require('../models/Company');
const User = require('../models/User');

/**
 * @desc    Get all companies
 * @route   GET /api/companies
 * @access  Public
 */
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({});
    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Get company details
 * @route   GET /api/companies/:id
 * @access  Public
 */
const getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('recruiter', 'name email');
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error('Get company details error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Create a new company profile
 * @route   POST /api/companies
 * @access  Private (Recruiter/Admin)
 */
const createCompany = async (req, res) => {
  const { name, description, industry, location, website, logo } = req.body;

  try {
    if (!name || !description || !industry || !location) {
      return res.status(400).json({ message: 'Please provide name, description, industry and location' });
    }

    const companyExists = await Company.findOne({ name });
    if (companyExists) {
      return res.status(400).json({ message: 'Company with this name already exists' });
    }

    // Create company
    const company = await Company.create({
      name,
      description,
      industry,
      location,
      website,
      logo: logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&fit=crop', // default logo placeholder
      recruiter: req.user._id
    });

    // Link recruiter user to this company
    if (req.user.role === 'recruiter') {
      await User.findByIdAndUpdate(req.user._id, { company: company._id });
    }

    res.status(201).json(company);
  } catch (error) {
    console.error('Create company error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getCompanies,
  getCompanyDetails,
  createCompany
};
