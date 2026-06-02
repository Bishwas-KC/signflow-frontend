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

  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/avatar', formData).then(r => r.data);
  },

  changePassword: (data) =>
  api.post('/auth/change-password', data).then(r => r.data),

  firebaseLogin: (idToken) =>
  api.post('/auth/firebase/google', { id_token: idToken }).then(r => r.data),

  verifyEmail: (userId, token) =>
  api.post('/auth/verify-email', { user_id: userId, token }).then(r => r.data),

  resendVerification: (email) =>
  api.post('/auth/resend-verification', { email }).then(r => r.data),

  forgotPassword: (email) =>
  api.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (data) =>
  api.post('/auth/reset-password', data).then(r => r.data),
};