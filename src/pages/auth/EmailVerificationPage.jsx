import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle, XCircle } from 'lucide-react';

function goToLoginWithContext(navigate) {
 const stored = localStorage.getItem('pending_sign_redirect');
  if (stored) {
  let parsed = {};
  try { parsed = JSON.parse(stored); } catch { /* Invalid JSON — ignore */ }
  const { redirect, email } = parsed;
 localStorage.removeItem('pending_sign_redirect');
 const params = new URLSearchParams();
 if (redirect) params.set('redirect', redirect);
 if (email) params.set('email', email);
 navigate(`/login?${params.toString()}`, { replace: true });
 } else {
 navigate('/login', { replace: true });
 }
}

export default function EmailVerificationPage() {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const hasValidParams = !!(id && token);
  const [status, setStatus] = useState(() => hasValidParams ? 'loading' : 'error');
  const [message, setMessage] = useState(() => hasValidParams ? '' : 'Invalid verification link.');
  const verifiedRef = useRef(false);

  useEffect(() => {
  if (!hasValidParams) return;
  if (verifiedRef.current) return;
  verifiedRef.current = true;

  const verifyEmail = async () => {
  try {
  const res = await authApi.verifyEmail(parseInt(id), token);

  if (res.data?.already_verified) {
  setStatus('success');
  setMessage('Your email has already been verified. You can now login.');
  } else if (res.success && res.data.verified) {
  setStatus('success');
  setMessage('Your email has been verified! You can now login.');
  }
  } catch (err) {
  const msg = err?.response?.data?.error?.message || '';
  if (msg.toLowerCase().includes('not pending') || msg.toLowerCase().includes('already verified')) {
  setStatus('success');
  setMessage('Your email has already been verified. You can now login.');
  } else {
  setStatus('error');
  setMessage(msg || 'Verification failed.');
  }
  }
  };

  verifyEmail();
  }, [id, token]); // eslint-disable-line react-hooks/exhaustive-deps

        useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => {
      goToLoginWithContext(navigate);
    }, 3000);
    return () => clearTimeout(timer);
  }, [status, navigate]);

        return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-10 max-w-md w-full text-center">
 {status === 'loading' && (
 <>
 <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
 <Spinner size="lg" className="text-indigo-500" />
 </div>
 <p className="text-gray-600">Verifying your email...</p>
 </>
 )}

  {status === 'success' && (
  <>
  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
  <CheckCircle size={36} className="text-emerald-500" />
  </div>
  <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
  <p className="text-gray-600 mb-6">{message}</p>
  <p className="text-sm text-gray-400">Redirecting to login...</p>
  </>
  )}

  {status === 'error' && (
  <>
  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
  <XCircle size={36} className="text-red-500" />
  </div>
  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
  <p className="text-gray-600 mb-6">{message}</p>
  <div className="flex flex-col sm:flex-row gap-3 justify-center">
  <button
  onClick={() => navigate('/login')}
  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
  >
  Sign In
  </button>
  <button
  onClick={() => navigate('/register')}
  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors min-h-[44px]"
  >
  Register
  </button>
  </div>
 </>
 )}
 </div>
 </div>
 );
}