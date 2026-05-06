// src/api/sign.api.js
import api from './axios';

export const signApi = {
  // ── Public ──────────────────────────────────────────────────────────────────
  // Fetch signing page context: signer info, document info, fields, pages_to_sign
  // Called before login so the auth gate can show document context.
  getSigningData: (token) =>
    api.get(`/sign/${token}`).then(r => r.data),

  // ── Auth-protected ───────────────────────────────────────────────────────────
  // Submit signature. Requires auth + email match (enforced by backend).
  submit: (token, signatureData) =>
    api.post(`/sign/${token}/submit`, { signature_data: signatureData }).then(r => r.data),

  // Decline to sign. Requires auth + email match (enforced by backend).
  decline: (token, reason = '') =>
    api.post(`/sign/${token}/decline`, { reason }).then(r => r.data),

  // Retrieve the authenticated user's saved signature.
  getSavedSignature: () =>
    api.get('/auth/signature').then(r => r.data),

  // Save a new signature to the user's account.
  saveSignature: (signatureData) =>
    api.put('/auth/signature', { signature_data: signatureData }).then(r => r.data),

  // Clear the user's saved signature.
  clearSavedSignature: () =>
    api.put('/auth/signature', { signature_data: null }).then(r => r.data),
};