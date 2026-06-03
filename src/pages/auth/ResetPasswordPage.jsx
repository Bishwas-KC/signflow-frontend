import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-4">
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-white p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Invalid reset link</h2>
          <p className="text-sm text-gray-500">This password reset link is invalid or expired.</p>
          <Button onClick={() => navigate('/forgot-password')} className="w-full">
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });
      toast.success('Password reset successfully. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Password reset failed. The link may have expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-400 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xl leading-none">S</span>
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">Signflow</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-white p-6 backdrop-blur-xl">
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">Reset your password</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your new password for <strong className="text-gray-700">{email}</strong>.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-gray-400 font-medium">
          &copy; {new Date().getFullYear()} Signflow Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
}
