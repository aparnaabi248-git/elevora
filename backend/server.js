
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const initCron = require('./cron/jobCron');

// Load environment variables for local development
dotenv.config();

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

// CORS configuration
app.use(cors());

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message:
    'Too many requests from this IP, please try again after 15 minutes.'
});

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload directory: temporary storage on Vercel,
// regular uploads folder during local development
const uploadDir = process.env.VERCEL
  ? '/tmp/elevora-uploads'
  : path.join(__dirname, 'uploads');

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Mount API routes
app.use('/api/auth', apiLimiter, require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Elevora Career Intelligence API',
    status: 'running'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Elevora API is running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error:
      process.env.NODE_ENV === 'development'
        ? err.stack
        : undefined
  });
});

// Initialize database and cron jobs locally.
// On Vercel, do not start a persistent Express listener.
if (process.env.VERCEL) {
  connectDB();
} else {
  connectDB();
  initCron();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });
}

// Export the Express app for Vercel
module.exports = app;
