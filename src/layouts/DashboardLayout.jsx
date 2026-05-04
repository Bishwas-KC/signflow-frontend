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
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-all active:scale-95"
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
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-colors duration-300 ${mobile ? 'w-64' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-slate-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">S</span>
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-white">Signflow</span>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm shadow-indigo-100 dark:shadow-none'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setProfileOpen(true)}
            className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0 hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-600 transition-all shadow-sm"
            title="Edit profile"
          >
            {getInitials(user?.name)}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-500 truncate mt-0.5">{user?.email}</p>
          </div>
          <div className="flex flex-col gap-1">
            <ThemeToggle />
            <button onClick={handleLogout} title="Logout"
              className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50 animate-slide-right">
            <Sidebar mobile />
          </div>
        </div>
      )}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-slate-400">
            <Menu size={22} />
          </button>
          <span className="font-bold text-gray-900 dark:text-white">Signflow</span>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          <div className="min-h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}