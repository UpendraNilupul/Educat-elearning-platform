import axios from 'axios';

// Automatically points to your live server in production, or localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true // 🌟 This automatically sends your secure session cookies with EVERY request!
});

// Interceptor to inject role and user ID headers from sessionStorage for multi-tab isolation
api.interceptors.request.use((config) => {
    const role = sessionStorage.getItem('userRole');
    const userId = sessionStorage.getItem('userId');
    if (role) {
        config.headers['x-user-role'] = role;
    }
    if (userId) {
        config.headers['x-user-id'] = userId;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;