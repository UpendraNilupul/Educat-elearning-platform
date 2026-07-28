import axios from 'axios';

// Automatically points to your live server in production, or localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true // 🌟 This automatically sends your secure session cookies with EVERY request!
});


export default api;