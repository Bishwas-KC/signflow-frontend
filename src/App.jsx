import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthLayout     from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import LoginPage      from '@/pages/auth/LoginPage';
import RegisterPage   from '@/pages/auth/RegisterPage';
import DashboardPage  from '@/pages/dashboard/DashboardPage';
import DocumentsPage  from '@/pages/documents/DocumentsPage';
import DocumentEditorPage  from '@/pages/documents/DocumentEditorPage';
import DocumentDetailPage  from '@/pages/documents/DocumentDetailPage';
import ContactsPage   from '@/pages/contacts/ContactsPage';
import CompaniesPage  from '@/pages/companies/CompaniesPage';
import SigningPage    from '@/pages/signing/SigningPage';
import { Spinner }   from '@/components/ui/Spinner';
import GoogleCallbackPage from '@/pages/auth/GoogleCallbackPage';
import NotFoundPage from '@/pages/NotFoundPage';



function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

// Route guard — redirect authenticated users away from auth pages
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public signing page — no auth required */}
      <Route path="/sign/:token" element={<SigningPage />} />

      {/* Google OAuth callback — must be public */}
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth pages */}
      <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Dashboard pages */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard"                         element={<DashboardPage />} />
        <Route path="/dashboard/documents"               element={<DocumentsPage />} />
        <Route path="/dashboard/documents/:id"           element={<DocumentDetailPage />} />
        <Route path="/dashboard/documents/:id/editor"    element={<DocumentEditorPage />} />
        <Route path="/dashboard/contacts"                element={<ContactsPage />} />
        <Route path="/dashboard/companies"               element={<CompaniesPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*"   element={<NotFoundPage />} />
    </Routes>
  );
}