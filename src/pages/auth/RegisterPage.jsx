import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle, Lock, FileText } from 'lucide-react';

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
  const [searchParams] = useSearchParams();
 const lockedEmail = searchParams.get('email') || '';

 const [step, setStep] = useState('form');
 const [email, setEmail] = useState('');
 const [serverError, setServerError] = useState('');
 const [successMessage, setSuccessMessage] = useState('');

 const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
 resolver: zodResolver(schema),
 defaultValues: { email: lockedEmail },
 });

 const onSubmit = async (data) => {
 setServerError('');
 setSuccessMessage('');

 try {
 const res = await authApi.register(data);

 setEmail(data.email);

 // Store signing context so EmailVerificationPage can pick it up
 const params = {};
 const redirectParam = searchParams.get('redirect');
 const emailParam = searchParams.get('email');
 if (redirectParam) params.redirect = redirectParam;
 if (emailParam) params.email = emailParam;
 if (Object.keys(params).length) {
 localStorage.setItem('pending_sign_redirect', JSON.stringify(params));
 }

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
  <div className="space-y-4">
 <div>
 <h1 className="text-2xl font-bold text-gray-900">
 {step === 'form' ? 'Create Account' : 'Check Your Email'}
 </h1>
 <p className="text-sm text-gray-500 mt-1.5 font-medium">
 {step === 'form'
 ? 'Enter your details to get started.'
 : 'We sent a verification link to your email.'}
 </p>
 </div>

 {lockedEmail && step === 'form' && (
 <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
 <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
 <FileText size={16} className="text-indigo-600" />
 </div>
 <div>
 <p className="text-sm font-bold text-indigo-800">Create account to sign a document</p>
 <p className="text-xs text-indigo-600 mt-1">
 Your email <strong>{lockedEmail}</strong> is pre-filled from the invitation
 </p>
 </div>
 </div>
 )}

  {step === 'form' && (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
 <Input
 label="Full Name"
 placeholder="John Doe"
 error={errors.name?.message}
 {...register('name')}
 />
 <div className="space-y-1">
 <Input
 label="Email Address"
 type="email"
 placeholder="you@example.com"
 error={errors.email?.message}
 readOnly={!!lockedEmail}
 {...register('email')}
 className={lockedEmail ? 'bg-gray-50' : ''}
 />
 {lockedEmail && (
  <p className="flex items-center gap-1 text-xs font-medium text-indigo-500 mt-1">
 <Lock size={10} /> Locked from signing invitation
 </p>
 )}
 </div>
 <Input
 label="Password"
 type="password"
 placeholder="Min. 8 characters"
 error={errors.password?.message}
 {...register('password')}
 />
 <Input
 label="Confirm Password"
 type="password"
 placeholder="Repeat password"
 error={errors.password_confirmation?.message}
 {...register('password_confirmation')}
 />

 {serverError && (
 <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl px-4 py-3">
 {serverError}
 </div>
 )}

 <Button type="submit" className="w-full rounded-xl shadow-lg shadow-indigo-500/20" loading={isSubmitting} size="lg">
 Create Account
 </Button>
 </form>
 )}

 {step === 'success' && (
 <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4">
 <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
 <CheckCircle size={28} className="text-emerald-600" />
 </div>
 <p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
 {email && (
 <p className="text-xs text-emerald-600">
 Sent to <strong>{email}</strong>
 </p>
 )}
 </div>
 )}

 {step === 'form' && (
 <p className="text-center text-sm text-gray-500 font-medium">
 Already have an account?{' '}
 <Link to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="text-indigo-600 font-bold hover:underline">
  Sign In
 </Link>
 </p>
 )}

 {step === 'success' && (
 <Link to={lockedEmail ? `/login?${searchParams.toString()}` : '/login'}>
 <Button variant="secondary" className="w-full rounded-xl">Back to Sign In</Button>
 </Link>
 )}
 </div>
 );
}
