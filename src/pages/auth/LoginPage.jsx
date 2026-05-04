import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message || 'Login failed. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5 font-medium">Please enter your details to sign in.</p>
      </div>

      {/* Google OAuth */}
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
            <Link to="/forgot-password" size="xs" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {serverError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={14} />
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full rounded-xl shadow-lg shadow-indigo-500/20" loading={isSubmitting} size="lg">
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