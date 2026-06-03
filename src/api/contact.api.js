import api from './axios';

export const contactApi = {
 list: (params = {}) =>
 api.get('/contacts', { params }).then(r => r.data),

  create: (data) =>
 api.post('/contacts', data).then(r => r.data),

 update: (id, data) =>
 api.put(`/contacts/${id}`, data).then(r => r.data),

 delete: (id) =>
 api.delete(`/contacts/${id}`).then(r => r.data),

  stats: () =>
 api.get('/contacts/stats').then(r => r.data),

};