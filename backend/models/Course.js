const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  provider: { type: String, default: 'Online Resource' },
  url: { type: String, required: true },
  skillsTaught: { type: [String], default: [], index: true },
  rating: { type: Number, default: 4.5 },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
