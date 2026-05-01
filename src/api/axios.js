import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 30000,
});

// ── Request interceptor — attach token ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle errors globally ────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status  = error.response?.status;
        const message = error.response?.data?.error?.message;

        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on auth pages
            if (!window.location.pathname.startsWith('/login')
                && !window.location.pathname.startsWith('/register')
                && !window.location.pathname.startsWith('/sign/')) {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        if (status === 422) {
            // Validation errors — let the form handle, no toast
            return Promise.reject(error);
        }

        if (status === 409 || status === 403 || status === 404) {
            toast.error(message || 'An error occurred.');
            return Promise.reject(error);
        }

        if (status === 410) {
            // 410 Gone — document expired or link invalid (signing page)
            return Promise.reject(error);
        }

        if (status >= 500) {
            toast.error('Server error. Please try again later.');
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;