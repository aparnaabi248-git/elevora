const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['student', 'consultant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consultantId: {
    type: String,
    required: true
  },
  consultantName: {
    type: String,
    required: true
  },
  consultantRole: {
    type: String,
    required: true
  },
  consultantType: {
    type: String,
    enum: ['ai', 'human'],
    default: 'ai'
  },
  topic: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  rating: {
    type: Number,
    default: 5
  },
  feedback: {
    type: String,
    default: ''
  },
  scratchpadContent: {
    type: String,
    default: ''
  },
  summaryReport: {
    keyTakeaways: [String],
    score: Number,
    recommendations: [String]
  },
  messages: {
    type: [messageSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
