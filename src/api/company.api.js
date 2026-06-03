import api from './axios';

export const companyApi = {
 list: (params = {}) =>
 api.get('/companies', { params }).then(r => r.data),

  create: (data) =>
 api.post('/companies', data).then(r => r.data),

 update: (id, data) =>
 api.put(`/companies/${id}`, data).then(r => r.data),

 delete: (id) =>
 api.delete(`/companies/${id}`).then(r => r.data),

 uploadLogo: (id, file) => {
 const form = new FormData();
 form.append('logo', file);
 return api.post(`/companies/${id}/logo`, form, {
 headers: { 'Content-Type': 'multipart/form-data' },
 }).then(r => r.data);
 },

 uploadSeal: (id, file) => {
 const form = new FormData();
 form.append('seal', file);
 return api.post(`/companies/${id}/seal`, form, {
 headers: { 'Content-Type': 'multipart/form-data' },
 }).then(r => r.data);
 },
};