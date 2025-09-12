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
    
    // Don't override Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    console.log('Axios request:', config.method?.toUpperCase(), config.url, 'with token:', !!token);
    return config;
  },
  (error) => {
    console.error('Axios request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and token refresh
instance.interceptors.response.use(
  (response) => {
    console.log('Axios response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('Axios response error:', error.response?.status, error.response?.data, error.config?.url);
    
    // Handle 401 errors (invalid/expired tokens) - but only for non-auth endpoints
    if (error.response?.status === 401 && 
        !error.config?._retry && 
        !error.config?.url?.includes('/api/auth/')) {
      
      error.config._retry = true;
      
      try {
        // Try to refresh the token
        const response = await instance.post('/api/auth/refresh-token');
        const { token } = response.data;
        
        // Update stored token
        if (localStorage.getItem('token')) {
          localStorage.setItem('token', token);
        } else if (sessionStorage.getItem('token')) {
          sessionStorage.setItem('token', token);
        }
        
        // Retry the original request with new token
        error.config.headers.Authorization = `Bearer ${token}`;
        return instance(error.config);
      } catch (refreshError) {
        console.error('Token refresh failed, clearing auth and redirecting to login');
        // Clear invalid tokens and redirect to login
        if (window.clearAuthData) {
          window.clearAuthData();
        } else {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          localStorage.removeItem('role');
          sessionStorage.removeItem('role');
        }
        // Only redirect if we're not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // For auth endpoint failures, immediately clear tokens
    if (error.response?.status === 401 && error.config?.url?.includes('/api/auth/')) {
      console.error('Auth endpoint failed, clearing tokens');
      if (window.clearAuthData) {
        window.clearAuthData();
      }
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;
