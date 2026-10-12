const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const educationSchema = new mongoose.Schema({
  school: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  startYear: { type: Number },
  endYear: { type: Number }
});

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  description: { type: String }
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuingOrganization: { type: String, required: true },
  issueDate: { type: Date },
  expirationDate: { type: Date },
  credentialUrl: { type: String }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'recruiter', 'admin'],
    default: 'student'
  },
  // Student Specific Fields
  skills: { type: [String], default: [] },
  education: { type: [educationSchema], default: [] },
  experience: { type: [experienceSchema], default: [] },
  certifications: { type: [certificationSchema], default: [] },
  resumeUrl: { type: String, default: '' },
  resumeScore: { type: Number, default: 0 },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  profileCompletion: { type: Number, default: 0 },
  
  // LinkedIn Specific Fields
  linkedinUrl: { type: String, default: '' },
  linkedinHeadline: { type: String, default: '' },
  linkedinConnected: { type: Boolean, default: false },
  linkedinLastSynced: { type: Date },
  avatarUrl: { type: String, default: '' },
  headline: { type: String, default: '' },
  bio: { type: String, default: '' },
  
  // Recruiter Specific Fields
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  
  // Reset Password fields
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare Password helper
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate profile completion helper
userSchema.methods.calculateProfileCompletion = function () {
  let score = 20; // 20% for basic registration (name, email)
  if (this.skills && this.skills.length > 0) score += 20;
  if (this.education && this.education.length > 0) score += 20;
  if (this.experience && this.experience.length > 0) score += 20;
  if (this.resumeUrl) score += 10;
  if (this.certifications && this.certifications.length > 0) score += 10;
  if (this.linkedinConnected) score += 10;
  this.profileCompletion = Math.min(score, 100);
  return this.profileCompletion;
};

module.exports = mongoose.model('User', userSchema);
