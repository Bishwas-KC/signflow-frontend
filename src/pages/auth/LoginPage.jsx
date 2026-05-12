import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { AlertCircle, Mail } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [serverError, setServerError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const handleResendVerification = async () => {
    try {
      await authApi.resendVerification(userEmail);
      toast.success('Verification email sent!');
    } catch {
      toast.error('Failed to resend email.');
    }
  };

  const onSubmit = async (data) => {
    setServerError('');
    setNeedsVerification(false);
    setUserEmail(data.email);

    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      const message = err?.response?.data?.error?.message;

      if (code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
        setServerError(message || 'Please verify your email before logging in.');
      } else {
        setServerError(message || 'Invalid email or password.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5 font-medium">Please enter your details to sign in.</p>
      </div>

      <button
        onClick={loginWithGoogle}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-[0.98]"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>

      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {needsVerification ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Email not verified</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  {serverError}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResendVerification}
              className="w-full py-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
            >
              Resend verification email
            </button>
          </div>
        ) : (
          serverError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle size={14} />
              {serverError}
            </div>
          )
        )}

        <Button 
          type="submit" 
          className="w-full rounded-xl shadow-lg shadow-indigo-500/20" 
          loading={isSubmitting} 
          size="lg"
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-slate-500 font-medium">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}