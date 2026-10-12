const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  category: { type: String, default: 'General' },
  demandLevel: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  description: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);
