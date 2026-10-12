const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const apiKey = process.env.GEMINI_API_KEY?.trim();

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Google Gemini AI initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error.message);
  }
} else {
  console.warn('GEMINI_API_KEY is not defined in the environment variables. AI features will be unavailable.');
}

const getGeminiClient = () => genAI;

module.exports = {
  getGeminiClient
};
