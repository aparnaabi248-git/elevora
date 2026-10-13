import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000 // 60 seconds — AI features with retries/backoff need extra time
});

// Automatically inject JWT token into requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('elevora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Attach Retry-After info to errors so frontend components can show
// accurate wait times to the user.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const retryAfter = error.response.headers?.['retry-after'];
      if (retryAfter) {
        error.retryAfterSeconds = parseInt(retryAfter, 10) || 60;
      }
    }
    return Promise.reject(error);
  }
);

export default API;

