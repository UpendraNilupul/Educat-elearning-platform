import axios from 'axios';

// Automatically points to your live server in production, or localhost in development
export const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_BASE}/api`,
    withCredentials: true // 🌟 This automatically sends your secure session cookies with EVERY request!
});

export default api;