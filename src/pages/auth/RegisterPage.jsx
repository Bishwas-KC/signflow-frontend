import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    setSuccessMessage('');

    try {
      const res = await authApi.register(data);
      
      setEmail(data.email);
      
      if (res.data.resent) {
        setSuccessMessage('Your previous verification link expired. A new verification email has been sent.');
      } else {
        setSuccessMessage('Account created! Please check your email to verify your account.');
      }
      
      setStep('success');
    } catch (err) {
      const data = err?.response?.data?.error;
      setServerError(data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {step === 'form' ? 'Create Account' : 'Check Your Email'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5 font-medium">
          {step === 'form' 
            ? 'Enter your details to get started.' 
            : 'We sent a verification link to your email.'}
        </p>
      </div>

      {/* Step 1: Registration Form */}
      {step === 'form' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.password_confirmation?.message}
            {...register('password_confirmation')}
          />

          {serverError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 rounded-xl p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
              {serverError.includes('already exists') && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1"
                >
                  Go to login
                </button>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full rounded-xl shadow-lg shadow-indigo-500/20"
              loading={isSubmitting}
              size="lg"
            >
              Create Account
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Success */}
      {step === 'success' && (
        <div className="space-y-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Account Created!</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              We've sent a verification link to<br />
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{email}</span>
            </p>
          </div>

          {successMessage && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 rounded-xl p-4">
              <p className="text-sm text-indigo-700 dark:text-indigo-400">{successMessage}</p>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Next steps
            </p>
            <ol className="text-xs text-gray-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
              <li>Click the link in your email inbox</li>
              <li>Verify your email address</li>
              <li>Return here to login</li>
            </ol>
          </div>

          <Button
            className="w-full rounded-xl"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-gray-500 dark:text-slate-500 font-medium">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}