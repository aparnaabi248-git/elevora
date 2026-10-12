const express = require('express');
const router = express.Router();
const { getCompanies, getCompanyDetails, createCompany } = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getCompanies)
  .post(protect, authorize('recruiter', 'admin'), createCompany);

router.route('/:id')
  .get(getCompanyDetails);

module.exports = router;
