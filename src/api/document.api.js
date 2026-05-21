import api from './axios';

export const documentApi = {
 // ── List with role filter (efficiency: server-side filtering) ───────────────────
 list: (params = {}) => {
 const query = new URLSearchParams();
 if (params.search) query.append('search', params.search);
 if (params.status) query.append('status', params.status);
 if (params.role) query.append('role', params.role); // 'owner'|'signer'|'all'
 if (params.page) query.append('page', params.page);
 if (params.per_page) query.append('per_page', params.per_page);

 return api.get(`/documents?${query.toString()}`).then(r => r.data);
 },

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

  restore: (id) =>
  api.post(`/documents/${id}/restore`).then(r => r.data),

  deleteOriginalFile: (id) =>
  api.delete(`/documents/${id}/original-file`).then(r => r.data),

  stats: () =>
  api.get('/documents/stats').then(r => r.data),

  dailyActivity: () =>
  api.get('/documents/activity-count').then(r => r.data),

  validate: (id) =>
 api.get(`/documents/${id}/validate`).then(r => r.data),

 send: (id, data = {}) =>
 api.post(`/documents/${id}/send`, data).then(r => r.data),

 // ── Cancel with approval workflow ───────────────────────────────────────
 cancel: (id) =>
 api.post(`/documents/${id}/cancel`).then(r => r.data),

 requestCancel: (id) =>
 api.post(`/documents/${id}/request-cancel`).then(r => r.data),

 approveCancel: (id) =>
 api.post(`/documents/${id}/approve-cancel`).then(r => r.data),

  // ── Delete with approval workflow ───────────────────────────────────────
  requestDelete: (id) =>
  api.post(`/documents/${id}/request-delete`).then(r => r.data),

  approveDelete: (id) =>
  api.post(`/documents/${id}/approve-delete`).then(r => r.data),

  rejectDelete: (id) =>
  api.post(`/documents/${id}/reject-delete`).then(r => r.data),

  cancelDelete: (id) =>
  api.post(`/documents/${id}/cancel-delete`).then(r => r.data),

 // ── Signers ────────────────────────────────────────────────────────────
 addSigner: (id, data) =>
 api.post(`/documents/${id}/signers`, data).then(r => r.data),

 removeSigner: (id, signerId) =>
 api.delete(`/documents/${id}/signers/${signerId}`).then(r => r.data),

 reorderSigners: (id, orderedIds) =>
 api.put(`/documents/${id}/signers/reorder`, { ordered_ids: orderedIds }).then(r => r.data),

 // ── Fields ────────────────────────────────────────────────────────────
 addField: (id, data) =>
 api.post(`/documents/${id}/fields`, data).then(r => r.data),

 bulkAddFields: (id, fields) =>
 api.post(`/documents/${id}/fields/bulk`, { fields }).then(r => r.data),

 updateField: (id, fieldId, data) =>
 api.put(`/documents/${id}/fields/${fieldId}`, data).then(r => r.data),

 removeField: (id, fieldId) =>
 api.delete(`/documents/${id}/fields/${fieldId}`).then(r => r.data),

 auditLog: (id) =>
 api.get(`/documents/${id}/audit-log`).then(r => r.data),

 // ── Direct Dashboard Signing (OTP flow) ───────────────────────────────
 sign: (id, signatureData) =>
 api.post(`/documents/${id}/sign`, { signature_data: signatureData }).then(r => r.data),
 signVerifyOtp: (id, otp) =>
 api.post(`/documents/${id}/sign/verify-otp`, { otp }).then(r => r.data),
};
