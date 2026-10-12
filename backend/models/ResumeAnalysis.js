const mongoose = require('mongoose');

const parsedEducationSchema = new mongoose.Schema({
  school: { type: String },
  degree: { type: String },
  fieldOfStudy: { type: String }
});

const parsedExperienceSchema = new mongoose.Schema({
  company: { type: String },
  role: { type: String },
  duration: { type: String },
  description: { type: String }
});

const roadmapItemSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  description: { type: String },
  resources: [{ type: String }],
  estimatedTime: { type: String }
});

const resumeAnalysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  resumeUrl: { type: String, required: true },
  extractedInfo: {
    skills: { type: [String], default: [] },
    education: { type: [parsedEducationSchema], default: [] },
    experience: { type: [parsedExperienceSchema], default: [] },
    projects: { type: [String], default: [] },
    certifications: { type: [String], default: [] }
  },
  resumeScore: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  careerSuggestions: { type: [String], default: [] },
  learningRoadmap: { type: [roadmapItemSchema], default: [] }
}, {
  timestamps: true
});

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
