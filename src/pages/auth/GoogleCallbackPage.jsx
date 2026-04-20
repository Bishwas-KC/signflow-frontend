import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const [searchParams]    = useSearchParams();
  const { saveSession }   = useAuth();
  const navigate          = useNavigate();
  const handledRef        = useRef(false); // prevent double-call in StrictMode

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const code  = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      toast.error('Google sign-in was cancelled or failed.');
      navigate('/login', { replace: true });
      return;
    }

    // Exchange code for token via Laravel backend
    import('@/api/auth.api').then(({ authApi }) => {
      authApi.googleCallback(code)
        .then(res => {
          saveSession(res.data.user, res.data.token);
          toast.success(`Welcome, ${res.data.user.name}!`);
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          toast.error('Google authentication failed. Please try again.');
          navigate('/login', { replace: true });
        });
    });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">Completing Google sign-in…</p>
    </div>
  );
}