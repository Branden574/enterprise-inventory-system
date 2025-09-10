import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://enterprise-inventory-system-production.up.railway.app',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the token to all requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Axios request:', config.method?.toUpperCase(), config.url, 'with token:', !!token);
    return config;
  },
  (error) => {
    console.error('Axios request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
instance.interceptors.response.use(
  (response) => {
    console.log('Axios response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Axios response error:', error.response?.status, error.response?.data, error.config?.url);
    return Promise.reject(error);
  }
);

export default instance;
