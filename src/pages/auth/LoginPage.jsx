import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, Mail, Lock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
 email: z.string().email('Enter a valid email address'),
 password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
 const { login, loginWithGoogle } = useAuth();
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();

 const redirectTo = searchParams.get('redirect') || '/dashboard';
 const lockedEmail = searchParams.get('email') || '';

 const [serverError, setServerError] = useState('');
 const [needsVerification, setNeedsVerification] = useState(false);
 const [userEmail, setUserEmail] = useState('');

 const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
 resolver: zodResolver(schema),
 defaultValues: { email: lockedEmail },
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
 navigate(redirectTo);
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
 {lockedEmail ? (
 <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
 <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
 <FileText size={16} className="text-indigo-600" />
 </div>
 <div>
 <p className="text-sm font-bold text-indigo-800">Sign in to sign a document</p>
 <p className="text-xs text-indigo-600 mt-1">
 You are signing in as <strong>{lockedEmail}</strong>
 </p>
 </div>
 </div>
 ) : (
 <div>
 <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
 <p className="text-sm text-gray-500 mt-1.5 font-medium">Please enter your details to sign in.</p>
 </div>
 )}

 <button
 onClick={loginWithGoogle}
 className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
 >
 <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
 Continue with Google
 </button>

 <div className="relative flex items-center gap-4">
 <div className="flex-1 h-px bg-gray-100" />
 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">or</span>
 <div className="flex-1 h-px bg-gray-100" />
 </div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
 <div className="space-y-1">
 <Input
 label="Email Address"
 type="email"
 placeholder="you@example.com"
 error={errors.email?.message}
 disabled={!!lockedEmail}
 {...register('email')}
 />
 {lockedEmail && (
 <p className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 mt-1">
 <Lock size={10} /> Locked from signing invitation
 </p>
 )}
 </div>
 <div className="space-y-1">
 <Input
 label="Password"
 type="password"
 placeholder="••••••••"
 error={errors.password?.message}
 {...register('password')}
 />
 <div className="flex justify-end">
 <Link to="/forgot-password" className="text-xs font-bold text-indigo-600 hover:underline">
 Forgot password?
 </Link>
 </div>
 </div>

 {needsVerification ? (
 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
 <div className="flex items-start gap-3">
 <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
 <Mail size={16} className="text-amber-600" />
 </div>
 <div>
 <p className="text-sm font-bold text-amber-800">Email not verified</p>
 <p className="text-xs text-amber-600 mt-1">
 {serverError}
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={handleResendVerification}
 className="w-full py-2 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
 >
 Resend verification email
 </button>
 </div>
 ) : (
 serverError && (
 <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
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

 <p className="text-center text-sm text-gray-500 font-medium">
 Don't have an account?{' '}
 <Link to={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="text-indigo-600 font-bold hover:underline">
 Create account
 </Link>
 </p>
 </div>
 );
}
