import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
 const [searchParams] = useSearchParams();
 const { saveSession } = useAuth();
 const navigate = useNavigate();
 const handledRef = useRef(false); // prevent double-call in StrictMode

 useEffect(() => {
 if (handledRef.current) return;
 handledRef.current = true;

 const code = searchParams.get('code');
 const error = searchParams.get('error');

 if (error || !code) {
 toast.error('Google sign-in was cancelled or failed.');
 navigate('/login', { replace: true });
 return;
 }

 // Get sign token from sessionStorage (stored before redirect)
 const signToken = sessionStorage.getItem('sign_token');
 sessionStorage.removeItem('sign_token'); // Clean up

  // Exchange code for token via Laravel backend
  import('@/api/auth.api')
  .then(({ authApi }) => {
  authApi.googleCallback(code)
  .then(res => {
  const userData = res.data.data || res.data;
  saveSession(userData.user, userData.token);
   toast.success(`Welcome, ${userData.user.name}.`);

  // If coming from signing page, redirect back to signing
  if (signToken) {
  navigate(`/sign/${signToken}/sign`, { replace: true });
  } else {
  navigate('/dashboard', { replace: true });
  }
  })
  .catch(() => {
  toast.error('Google authentication failed. Please try again.');
  navigate('/login', { replace: true });
  });
  })
  .catch(() => {
  toast.error('Failed to load authentication module.');
  navigate('/login', { replace: true });
  });
  // Intentionally runs once on mount — searchParams, saveSession, navigate are stable
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

 return (
 <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
 <Spinner size="lg" />
 <p className="text-sm text-gray-500">Completing Google sign-in…</p>
 </div>
 );
}