import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { Spinner } from '@/components/ui/Spinner';

const AuthLayout = lazy(() => import('@/layouts/AuthLayout'));
const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const EmailVerificationPage = lazy(() => import('@/pages/auth/EmailVerificationPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'));
const DocumentEditorPage = lazy(() => import('@/pages/documents/DocumentEditorPage'));
const DocumentDetailPage = lazy(() => import('@/pages/documents/DocumentDetailPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const ContactsPage = lazy(() => import('@/pages/contacts/ContactsPage'));
const CompaniesPage = lazy(() => import('@/pages/companies/CompaniesPage'));
const SigningLayout = lazy(() => import('@/layouts/SigningLayout'));
const SigningPage = lazy(() => import('@/pages/sign/SigningPage'));
const SigningAuthPage = lazy(() => import('@/pages/sign/SigningauthPage'));
const ThankYouPage = lazy(() => import('@/pages/sign/ThankYouPage'));

const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const SuspenseFallback = () => (
 <div className="flex h-screen items-center justify-center bg-gray-50">
 <div className="text-center">
 <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
 <p className="text-sm text-gray-400">Loading...</p>
 </div>
 </div>
);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function LazyRoute({ children }) {
 return (
 <ErrorBoundary>
 <Suspense fallback={<SuspenseFallback />}>
 {children}
 </Suspense>
 </ErrorBoundary>
 );
}

export default function App() {
 return (
 <Routes>
 <Route path="/sign/:token" element={<LazyRoute><SigningAuthPage /></LazyRoute>} />

 <Route path="/sign/:token/thank-you" element={<LazyRoute><ThankYouPage /></LazyRoute>} />
  
  <Route path="/" element={<LazyRoute><LandingPage /></LazyRoute>} />
  <Route path="/login" element={<LazyRoute><AuthLayout><LoginPage /></AuthLayout></LazyRoute>} />
   <Route path="/register" element={<LazyRoute><AuthLayout><RegisterPage /></AuthLayout></LazyRoute>} />
   <Route path="/forgot-password" element={<LazyRoute><AuthLayout><ForgotPasswordPage /></AuthLayout></LazyRoute>} />
  <Route path="/reset-password/:token" element={<LazyRoute><ResetPasswordPage /></LazyRoute>} />
 <Route path="/auth/verify-email/:id/:token" element={<LazyRoute><EmailVerificationPage /></LazyRoute>} />
 <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
 <Route path="/dashboard" element={<LazyRoute><DashboardPage /></LazyRoute>} />
 <Route path="/dashboard/documents" element={<LazyRoute><DocumentsPage /></LazyRoute>} />
 <Route path="/dashboard/documents/:id" element={<LazyRoute><DocumentDetailPage /></LazyRoute>} />
 <Route path="/dashboard/documents/:id/editor" element={<LazyRoute><DocumentEditorPage /></LazyRoute>} />
  <Route path="/dashboard/profile" element={<LazyRoute><ProfilePage /></LazyRoute>} />
  <Route path="/dashboard/contacts" element={<LazyRoute><ContactsPage /></LazyRoute>} />
    <Route path="/dashboard/companies" element={<LazyRoute><CompaniesPage /></LazyRoute>} />
  </Route>
   <Route element={<LazyRoute><SigningLayout /></LazyRoute>}>
   <Route path="/sign/:token/sign" element={<LazyRoute><SigningPage /></LazyRoute>} />
  </Route>
 <Route path="*" element={<LazyRoute><NotFoundPage /></LazyRoute>} />
 </Routes>
 );
}
