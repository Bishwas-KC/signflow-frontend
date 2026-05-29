import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Mail, AlertCircle, X, CheckCircle } from 'lucide-react';
import { Sidebar } from '@/components/shared/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [resending, setResending] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleResend = async () => {
    if (!user?.email || resending) return;
    setResending(true);
    try {
      await authApi.resendVerification(user.email);
      toast.success('Verification email sent! Please check your inbox.', {
        duration: 5000,
        icon: <CheckCircle className="text-emerald-500" size={20} />,
      });
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const isVerified = user?.email_verified_at !== null;

  return (
    <div className="flex h-screen h-dynamic bg-gray-50 overflow-hidden">
      {/* Desktop sidebar wrapper — this transitions width */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}>
<Sidebar collapsed={collapsed} setCollapsed={setCollapsed} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm md:backdrop-blur-md animate-fade-in motion-reduce:animate-none" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50 animate-slide-right">
            <Sidebar mobile collapsed={collapsed} setCollapsed={setCollapsed} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </div>
        </div>
      )}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Verification Banner */}
        {!isVerified && bannerVisible && (
          <div className="bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-between gap-4 animate-fade-in flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-white" />
              </div>
              <div className="text-xs sm:text-sm font-medium truncate">
                Please verify your email address to unlock all features.
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleResend}
                disabled={resending}
                className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Email'}
              </button>
              <button
                onClick={() => setBannerVisible(false)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all">
            <Menu size={24} />
          </button>
          <span className="font-black text-xl text-gray-900 tracking-tighter">Signflow</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pb-16 sm:pb-20">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
