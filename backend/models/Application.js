const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Interviewing', 'Rejected'],
    default: 'Applied'
  },
  resumeUrl: { type: String, required: true },
  coverLetter: { type: String, default: '' }
}, {
  timestamps: true
});

// Avoid duplicate applications
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
