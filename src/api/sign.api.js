// src/api/sign.api.js
import api from './axios';

export const signApi = {
 // ── Public ──────────────────────────────────────────────────────────────────
 // Fetch signing page context: signer info, document info, fields, pages_to_sign
 // Called before login so the auth gate can show document context.
 getSigningData: (token) =>
 api.get(`/sign/${token}`).then(r => r.data),

 // ── Auth-protected ───────────────────────────────────────────────────────────
 // Step 1: Submit signature → sends OTP to signer's email
 // signatureData can be:
 // - base64 data URI string (for draw/type) → method: 'draw'
 // - File object (for upload) → multipart/form-data with method: 'upload'
   submit: (token, signatureData, method = 'draw') => {
     return api.post(`/sign/${token}/submit`, {
       method,
       signature_data: signatureData,
     }).then(r => r.data);
   },

 // Step 2: Verify OTP → completes the signature
 verifyOtp: (token, otp) =>
 api.post(`/sign/${token}/verify-otp`, { otp }).then(r => r.data),

 // Decline to sign. Requires auth + email match (enforced by backend).
 decline: (token, reason = '') =>
 api.post(`/sign/${token}/decline`, { reason }).then(r => r.data),

  // Retrieve all saved signatures for the authenticated user.
  getSavedSignatures: () =>
  api.get('/auth/signatures').then(r => r.data),

  // Save a new signature to the user's account.
  saveNewSignature: (signatureData, label) =>
  api.post('/auth/signatures', { signature_data: signatureData, label }).then(r => r.data),

  // Delete a saved signature.
  deleteSignature: (id) =>
  api.delete(`/auth/signatures/${id}`).then(r => r.data),

};