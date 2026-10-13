const rateLimit = require('express-rate-limit');

/**
 * Per-user rate limiter for AI routes.
 *
 * Uses the authenticated user's MongoDB _id (set by the auth middleware that
 * runs before AI routes) as the key, so the limit tracks individual users
 * rather than shared IPs (important on Vercel where many users share the
 * same egress IP).
 *
 * In-memory store: on Vercel each serverless instance has its own counter,
 * so this is not a global limit — but it still prevents a single user from
 * burst-firing requests within one instance, which is the primary cause of
 * per-minute quota exhaustion on the Gemini API.
 *
 * 10 requests per 60 seconds per user is generous for interactive AI features
 * while staying well within Gemini's free-tier RPM limits.
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 AI requests per user per minute
  standardHeaders: true,
  legacyHeaders: false,
  // Key by authenticated user ID (falls back to IP if auth hasn't run yet,
  // but AI routes always require auth so req.user should always exist).
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  },
  handler: (req, res) => {
    const retryAfterSeconds = Math.ceil((req.rateLimit?.resetTime - Date.now()) / 1000) || 60;
    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      code: 'AI_RATE_LIMITED',
      message: `You have made too many AI requests. Please wait ${retryAfterSeconds} seconds and try again.`,
      retryAfter: retryAfterSeconds
    });
  }
});

module.exports = aiRateLimiter;
