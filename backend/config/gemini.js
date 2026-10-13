const { GoogleGenerativeAI } = require('@google/generative-ai');

// Primary model: live-verified (Oct 2026) against the public Gemini v1beta
// API with this project's SDK. Override with GEMINI_MODEL when needed.
// Retired IDs such as "gemini-2.0-flash"/"gemini-1.5-flash" now return
// HTTP 404 and must not be used.
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

// Second live-verified model, tried only when the primary model fails with a
// retryable service error (overload/rate-limit). Override with
// GEMINI_FALLBACK_MODEL. Never fabricated analysis — if both fail, we throw.
const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite';

// Trim pasted values and strip a single layer of surrounding quotes, since
// dashboard env editors often preserve them (a quoted ID would 404).
const sanitizeModelName = (value) => {
  let name = String(value || '').trim();
  if (
    name.length >= 2 &&
    ((name.startsWith('"') && name.endsWith('"')) ||
      (name.startsWith("'") && name.endsWith("'")))
  ) {
    name = name.slice(1, -1).trim();
  }
  return name;
};

// Sanitize API key: trim whitespace and strip a single layer of surrounding
// quotes. Dashboard editors and .env files sometimes introduce these, causing
// an otherwise-valid key to be rejected as API_KEY_INVALID.
const sanitizeApiKey = (value) => {
  let key = String(value || '').trim();
  if (
    key.length >= 2 &&
    ((key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'")))
  ) {
    key = key.slice(1, -1).trim();
  }
  return key;
};

// Heuristic for values that cannot be model IDs: pasted API keys/secrets.
// Real model IDs are short and limited to [A-Za-z0-9_.-].
const looksLikeSecret = (name) =>
  /^AIza/i.test(name) || name.length > 64 || /[^A-Za-z0-9_.-]/.test(name);

const misconfiguredModelError = (varName = 'GEMINI_MODEL') => {
  const error = new Error(
    `The AI model is misconfigured on the server (${varName}). Please contact support.`
  );
  error.status = 500;
  error.code = 'GEMINI_MODEL_MISCONFIGURED';
  return error;
};

const getGeminiModelName = () => {
  const configured = sanitizeModelName(process.env.GEMINI_MODEL);
  if (!configured) return DEFAULT_GEMINI_MODEL;
  // Fail fast on values that cannot be model IDs (pasted secrets, quoted
  // blobs). Never log or transmit the raw value.
  if (looksLikeSecret(configured)) throw misconfiguredModelError();
  return configured;
};

const getGeminiFallbackModelName = () => {
  const configured = sanitizeModelName(process.env.GEMINI_FALLBACK_MODEL);
  const fallback = configured || DEFAULT_GEMINI_FALLBACK_MODEL;
  if (looksLikeSecret(fallback)) throw misconfiguredModelError('GEMINI_FALLBACK_MODEL');
  // No fallback when it duplicates the primary model.
  return fallback === getGeminiModelName() ? null : fallback;
};

let genAI = null;

const getGeminiClient = () => {
  // Lazily initialize so Vercel cold starts and .env loading order
  // always pick up the current environment. Never log the key itself.
  if (genAI) return genAI;

  const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
  if (!apiKey) {
    console.warn(
      'GEMINI_API_KEY is not defined in the environment variables. AI features will be unavailable.'
    );
    return null;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Google Gemini AI initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error.message);
    genAI = null;
  }

  return genAI;
};

const resetGeminiClient = () => {
  genAI = null;
};

/**
 * Boot-time diagnostic: validates configuration and returns a summary object.
 * Never logs or returns the actual API key value.
 */
const validateGeminiConfig = () => {
  const result = {
    apiKeySet: false,
    primaryModel: null,
    fallbackModel: null,
    errors: []
  };

  const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
  result.apiKeySet = !!apiKey;
  if (!apiKey) {
    result.errors.push('GEMINI_API_KEY is not set — all AI features will fail.');
  }

  try {
    result.primaryModel = getGeminiModelName();
  } catch (err) {
    result.errors.push(`Primary model misconfigured: ${err.code || err.message}`);
  }

  try {
    result.fallbackModel = getGeminiFallbackModelName();
  } catch (err) {
    result.errors.push(`Fallback model misconfigured: ${err.code || err.message}`);
  }

  return result;
};

module.exports = {
  getGeminiClient,
  getGeminiModelName,
  getGeminiFallbackModelName,
  resetGeminiClient,
  validateGeminiConfig,
  sanitizeApiKey,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_FALLBACK_MODEL
};
