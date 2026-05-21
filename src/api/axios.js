import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
 baseURL: import.meta.env.VITE_API_URL,
 headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
 timeout: 30000,
});

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

 // ── Security: Token expired or invalid ─────────────────────────────
 if (status === 401) {
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 
 // Only redirect if not already on auth/signing pages
 const path = window.location.pathname;
 if (!path.startsWith('/login') && 
 !path.startsWith('/register') && 
 !path.startsWith('/sign/')) {
 window.location.href = '/login';
 }
 return Promise.reject(error);
 }

 // ── Validation errors (422) ──────────────────────────────────────
 // Let individual forms handle these — no global toast
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
 // Don't show toast for email-already errors - let form handle it
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

 // ── Gone (410) — Document expired or link invalid ──────────────
 if (status === 410) {
 return Promise.reject(error); // Let signing page handle this
 }

 // ── Server errors (500+) ────────────────────────────────────────
 if (status >= 500) {
 toast.error('A server error occurred. Please try again later.', {
 duration: 5000,
 id: 'server-error',
 });
 return Promise.reject(error);
 }

 return Promise.reject(error);
 }
);

export default api;
