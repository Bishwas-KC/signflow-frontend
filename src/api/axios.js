import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

let isRefreshing = false;
let pendingRequests = [];

function onRefreshed(newToken) {
  pendingRequests.forEach(cb => cb(newToken));
  pendingRequests = [];
}

function addToQueue(cb) {
  pendingRequests.push(cb);
}

function clearAuthAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  const path = window.location.pathname;
  if (!path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/sign/')) {
    window.location.href = '/login';
  }
}

// ── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;
    const code = errorData?.error?.code;
    const message = errorData?.error?.message || errorData?.message;
    const originalRequest = error.config;

    // ── 401: Attempt token refresh before giving up ────────────────
    if (status === 401 && !originalRequest?._retry) {
      // Login, register, and refresh are public/internal endpoints — 401 means wrong credentials or revoked token, not expired
      if (originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register') || originalRequest?.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }
      const token = localStorage.getItem('token');
      if (!token) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(resolve => {
          addToQueue(newToken => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      return api.post('/auth/refresh', { token })
        .then(res => {
          const newToken = res.data.data.token;
          localStorage.setItem('token', newToken);
          onRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((refreshError) => {
          onRefreshed(null);

          const refreshStatus = refreshError?.response?.status;

          // Only clear auth if token is genuinely invalid/revoked
          if (refreshStatus === 401) {
            clearAuthAndRedirect();
          } else {
            toast.error('Unable to refresh session. Please try reloading.', {
              duration: 5000,
            });
          }

          return Promise.reject(error);
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    // ── Validation errors (422) ──────────────────────────────────────
    if (status === 422) {
      return Promise.reject(error);
    }

    // ── Email verification required (403) ────────────────────────────
    if (status === 403 && code === 'EMAIL_NOT_VERIFIED') {
      toast.error('Please verify your email address before continuing.', {
        duration: 6000,
        id: 'email-verification-required',
      });
      return Promise.reject(error);
    }

    // ── Signer mismatch (403) ───────────────────────────────────────
    if (status === 403 && (code === 'EMAIL_MISMATCH' || code === 'SIGNER_MISMATCH')) {
      toast.error(message || 'This document is assigned to a different account.', {
        duration: 6000,
        id: 'signer-mismatch',
      });
      return Promise.reject(error);
    }

    // ── Sequential turn enforcement (422) ───────────────────────────
    if (status === 422 && code === 'NOT_YOUR_TURN') {
      toast.error(message || 'It\'s not your turn to sign yet.', {
        duration: 6000,
        id: 'not-your-turn',
      });
      return Promise.reject(error);
    }

    // ── Conflict errors (409) ───────────────────────────────────────
    if (status === 409) {
      if (code === 'EMAIL_ALREADY_REGISTERED' || code === 'EMAIL_ALREADY_EXISTS') {
        return Promise.reject(error);
      }
      toast.error(message || 'A conflict occurred. Please refresh and try again.', {
        duration: 5000,
      });
      return Promise.reject(error);
    }

    // ── Not Found (404) ───────────────────────────────────────────
    if (status === 404) {
      toast.error(message || 'The requested resource was not found.', {
        duration: 4000,
      });
      return Promise.reject(error);
    }

    // ── Gone (410) ──────────────────────────────────────────────
    if (status === 410) {
      return Promise.reject(error);
    }

    // ── Too Many Requests (429) ─────────────────────────────────
    if (status === 429) {
      toast.error(message || 'Too many requests. Please slow down.', {
        duration: 5000,
      });
      return Promise.reject(error);
    }

    // ── Server errors (500+) ────────────────────────────────────────
    if (status >= 500) {
      toast.error(message || 'A server error occurred. Please try again later.', {
        duration: 5000,
        id: 'server-error',
      });
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
