import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { getInitials } from '@/utils/helpers';
import { ProfileModal } from '@/components/shared/ProfileModal';

const navItems = [
  { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/dashboard/documents',    icon: FileText,         label: 'Documents'  },
  { to: '/dashboard/contacts',     icon: Users,            label: 'Contacts'   },
  { to: '/dashboard/companies',    icon: Building2,        label: 'Companies'  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <button
      onClick={cycleTheme}
      className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90"
      title={`Theme: ${theme}`}
    >
      <Icon size={18} className="animate-fade-in" />
    </button>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transition-all duration-500 ${mobile ? 'w-72' : 'w-72'}`}>
      {/* Logo */}
      <div className="flex items-center gap-4 px-8 py-8">
        <div className="w-10 h-10 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white font-black text-xl">S</span>
        </div>
        <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Signflow</span>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="px-4 text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm shadow-indigo-500/5'
                  : 'text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon size={20} className="transition-transform group-hover:scale-110" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-6 py-6 border-t border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setProfileOpen(true)}
            className="w-12 h-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[1.25rem] flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-sm flex-shrink-0 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-sm group"
            title="Edit profile"
          >
            <span className="group-hover:scale-110 transition-transform">{getInitials(user?.name)}</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight tracking-tight">{user?.name}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate mt-1 font-bold uppercase tracking-widest">{user?.email?.split('@')[0]}</p>
          </div>
          <div className="flex flex-col gap-1">
            <ThemeToggle />
            <button onClick={handleLogout} title="Logout"
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all active:scale-90">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50 animate-slide-right">
            <Sidebar mobile />
          </div>
        </div>
      )}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 transition-colors duration-500">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <Menu size={24} />
          </button>
          <span className="font-black text-xl text-gray-900 dark:text-white tracking-tighter">Signflow</span>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          <div className="min-h-full animate-fade-in pb-20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
