import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';

const schema = z.object({
  name:                 z.string().min(2, 'Name must be at least 2 characters'),
  email:                z.string().email('Enter a valid email'),
  password:             z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

export default function RegisterPage() {
  const { register: signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState({});

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerErrors({});
    try {
      await signup(data);
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.error?.errors || {};
      setServerErrors(errs);
    }
  };

  const fieldError = (field) =>
    errors[field]?.message || serverErrors[field]?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5 font-medium">Join Signflow and start signing today.</p>
      </div>

      <button
        onClick={loginWithGoogle}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-[0.98]"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
        Sign up with Google
      </button>

      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name" placeholder="John Doe" error={fieldError('name')} {...register('name')} />
        <Input label="Email Address" type="email" placeholder="you@example.com" error={fieldError('email')} {...register('email')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Password" type="password" placeholder="••••••••" error={fieldError('password')} {...register('password')} />
          <Input label="Confirm" type="password" placeholder="••••••••" error={fieldError('password_confirmation')} {...register('password_confirmation')} />
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full rounded-xl shadow-lg shadow-indigo-500/20" loading={isSubmitting} size="lg">
            Create Free Account
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-slate-500 font-medium">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}