const { GoogleGenerativeAI } = require('@google/generative-ai');

// Default to a currently supported Gemini flash model.
// Override with the GEMINI_MODEL environment variable when needed.
// NOTE: "gemini-3.6-flash" is not a valid/supported model and overloads with 503,
// so it must not be used as the default.
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

const getGeminiModelName = () => {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured || DEFAULT_GEMINI_MODEL;
};

let genAI = null;

const getGeminiClient = () => {
  // Lazily initialize so Vercel cold starts and .env loading order
  // always pick up the current environment. Never log the key itself.
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
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

module.exports = {
  getGeminiClient,
  getGeminiModelName,
  resetGeminiClient,
  DEFAULT_GEMINI_MODEL
};
