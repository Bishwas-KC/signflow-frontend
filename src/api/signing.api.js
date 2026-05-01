import api from './axios';

export const signingApi = {
  getByToken: (token) =>
    api.get(`/sign/${token}`).then(r => r.data),

  // Accepts FormData (supports file upload) or JSON
  submit: (token, formData) =>
    api.post(`/sign/${token}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  decline: (token, reason) =>
    api.post(`/sign/${token}/decline`, { reason }).then(r => r.data),
};