import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000 // 30 seconds timeout for AI processing
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

export default API;
