import axios from 'axios';

// Automatically points to your live server in production, or localhost in development
export const API_BASE = import.meta.env.VITE_API_BASE_URL 
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '') 
    : (import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
        : 'https://educat-elearning-platform.onrender.com');

const api = axios.create({
    baseURL: `${API_BASE}/api`,
    withCredentials: true // 🌟 This automatically sends your secure session cookies with EVERY request!
});

export default api;