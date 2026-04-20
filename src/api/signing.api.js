import api from './axios';

export const signingApi = {
  getByToken: (token) =>
    api.get(`/sign/${token}`).then(r => r.data),

  submit: (token, data) =>
    api.post(`/sign/${token}/submit`, data).then(r => r.data),

  approve: (token) =>
    api.post(`/sign/${token}/approve`).then(r => r.data),

  decline: (token, reason) =>
    api.post(`/sign/${token}/decline`, { reason }).then(r => r.data),
};