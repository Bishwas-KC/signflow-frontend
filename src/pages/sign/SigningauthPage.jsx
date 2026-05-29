import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signApi } from '@/api/sign.api';
import { Spinner } from '@/components/ui/Spinner';
import { AlertTriangle } from 'lucide-react';
import { getCurrentUser } from '@/utils/helpers';

export default function SigningAuthPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState(() => !token ? 'Invalid signing link.' : null);

  useEffect(() => {
  if (!token) return;

 (async () => {
 try {
 const res = await signApi.getSigningData(token);
 const data = res.data;
 const signerEmail = data.signer?.email;
 const signerStatus = data.signer?.status;

if (signerStatus === 'signed') {
navigate(`/sign/${token}/thank-you?doc_id=${data?.document?.id}`, { replace: true });
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
  `You are signed in as ${user.email ?? '(unknown)'}, but this document is for ${signerEmail}. Please sign out and use the correct account.`
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
      <div className="min-h-screen flex items-center justify-center bg-[#060d1a] p-6">
        <div className="max-w-sm w-full text-center bg-slate-900 border border-slate-800 rounded-[20px] p-10">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 mb-2">Link Not Valid</h2>
          <p className="text-sm text-slate-500 leading-relaxed break-words">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060d1a] p-6">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-sm text-slate-600 mt-4">Loading invitation…</p>
      </div>
    </div>
  );
}
