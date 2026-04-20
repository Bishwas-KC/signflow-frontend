import api from './axios';

export const documentApi = {
  list: (params = {}) =>
    api.get('/documents', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/documents/${id}`).then(r => r.data),

  create: (data, file) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(k, v); });
    form.append('file', file);
    return api.post('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  update: (id, data) =>
    api.put(`/documents/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/documents/${id}`).then(r => r.data),

  stats: () =>
    api.get('/documents/stats').then(r => r.data),

  validate: (id) =>
    api.get(`/documents/${id}/validate`).then(r => r.data),

  send: (id, data = {}) =>
    api.post(`/documents/${id}/send`, data).then(r => r.data),

  cancel: (id) =>
    api.post(`/documents/${id}/cancel`).then(r => r.data),

  // Signers
  addSigner: (id, data) =>
    api.post(`/documents/${id}/signers`, data).then(r => r.data),

  removeSigner: (id, signerId) =>
    api.delete(`/documents/${id}/signers/${signerId}`).then(r => r.data),

  reorderSigners: (id, orderedIds) =>
    api.put(`/documents/${id}/signers/reorder`, { ordered_ids: orderedIds }).then(r => r.data),

  // Fields
  addField: (id, data) =>
    api.post(`/documents/${id}/fields`, data).then(r => r.data),

  updateField: (id, fieldId, data) =>
    api.put(`/documents/${id}/fields/${fieldId}`, data).then(r => r.data),

  removeField: (id, fieldId) =>
    api.delete(`/documents/${id}/fields/${fieldId}`).then(r => r.data),

  auditLog: (id) =>
    api.get(`/documents/${id}/audit-log`).then(r => r.data),
};