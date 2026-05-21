import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signApi } from '@/api/sign.api';
import { Spinner } from '@/components/ui/Spinner';
import { AlertTriangle } from 'lucide-react';

function getCurrentUser() {
 try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export default function SigningAuthPage() {
 const { token } = useParams();
 const navigate = useNavigate();
 const [loadError, setLoadError] = useState(null);

 useEffect(() => {
 if (!token) {
 setLoadError('Invalid signing link.');
 return;
 }

 (async () => {
 try {
 const res = await signApi.getSigningData(token);
 const data = res.data;
 const signerEmail = data.signer?.email;
 const signerStatus = data.signer?.status;

 if (signerStatus === 'signed') {
 navigate(`/sign/${token}/thank-you`, { replace: true });
 return;
 }

 if (signerStatus === 'declined') {
 setLoadError('This signing invitation has already been declined.');
 return;
 }

 const user = getCurrentUser();

 if (user) {
 if (signerEmail && user.email?.toLowerCase() !== signerEmail.toLowerCase()) {
 setLoadError(
 `You are signed in as ${user.email}, but this document is for ${signerEmail}. Please sign out and use the correct account.`
 );
 return;
 }
 navigate(`/sign/${token}/sign`, { replace: true });
 return;
 }

 const encodedEmail = encodeURIComponent(signerEmail || '');
 navigate(`/login?redirect=/sign/${token}/sign&email=${encodedEmail}`, { replace: true });
 } catch (err) {
 const msg = err?.response?.data?.message;
 setLoadError(msg || 'Invalid or expired signing link.');
 }
 })();
 }, [token, navigate]);

 if (loadError) {
 return (
 <div style={{
 minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
 background: '#060d1a', padding: 24,
 }}>
  <div style={{
    maxWidth: 400, width: '100%', textAlign: 'center',
    background: '#0f172a', border: '1px solid #1e293b',
    borderRadius: 20, padding: 40,
  }}>
  <div style={{
    width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
  }}>
  <AlertTriangle size={24} style={{ color: '#ef4444' }} />
  </div>
  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
  Link Not Valid
  </h2>
  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, wordBreak: 'break-word' }}>{loadError}</p>
 </div>
 </div>
 );
 }

 return (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#060d1a', padding: 24,
  }}>
  <div style={{ textAlign: 'center' }}>
 <Spinner size="lg" />
 <p style={{ color: '#334155', fontSize: 13, marginTop: 16 }}>Loading invitation…</p>
 </div>
 </div>
 );
}
