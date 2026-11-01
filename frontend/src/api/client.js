import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach JWT bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('reshare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 token expiry cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      if (localStorage.getItem('reshare_token')) {
        localStorage.removeItem('reshare_token');
        localStorage.removeItem('reshare_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
