import api from './axios';

export const authApi = {
  register: (data) =>
    api.post('/auth/register', data).then(r => r.data),

  login: (data) =>
    api.post('/auth/login', data).then(r => r.data),

  logout: () =>
    api.post('/auth/logout').then(r => r.data),

  me: () =>
    api.get('/auth/me').then(r => r.data),

  updateProfile: (data) =>
    api.put('/auth/profile', data).then(r => r.data),

  googleRedirect: () =>
    api.get('/auth/google/redirect').then(r => r.data),

  googleCallback: (code) =>
    api.get(`/auth/google/callback?code=${encodeURIComponent(code)}`).then(r => r.data),

  verifyEmail: (userId, token) =>
    api.post('/auth/verify-email', { user_id: userId, token }).then(r => r.data),
};