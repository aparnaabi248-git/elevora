const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  
  // Either reference our Company model or store raw string for external jobs
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  companyName: { type: String, required: true },
  companyLogo: { type: String, default: '' },
  
  skillsRequired: { type: [String], default: [], index: true },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  salaryCurrency: { type: String, default: 'USD' },
  location: { type: String, required: true, index: true },
  
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Temporary'],
    default: 'Full-time'
  },
  workMode: {
    type: String,
    enum: ['Remote', 'Hybrid', 'On-site'],
    default: 'On-site'
  },
  experienceLevel: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Lead'],
    default: 'Entry'
  },
  
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  externalId: { type: String, unique: true, sparse: true }, // For JSearch/Adzuna syncing
  applyUrl: { type: String }, // For external jobs
  expiresAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
