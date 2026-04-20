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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">Start signing documents in minutes.</p>
      </div>

      <button
        onClick={loginWithGoogle}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
        Sign up with Google
      </button>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" placeholder="John Doe" error={fieldError('name')} {...register('name')} />
        <Input label="Email address" type="email" placeholder="you@example.com" error={fieldError('email')} {...register('email')} />
        <Input label="Password" type="password" placeholder="Min. 8 characters" error={fieldError('password')} {...register('password')} />
        <Input label="Confirm password" type="password" placeholder="Repeat password" error={fieldError('password_confirmation')} {...register('password_confirmation')} />

        <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}