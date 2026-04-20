import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {LayoutDashboard, FileText, Users, Building2,LogOut, Menu, X, ChevronDown,} from 'lucide-react';
import { getInitials } from '@/utils/helpers';
import { ProfileModal } from '@/components/shared/ProfileModal';


const navItems = [
  { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/dashboard/documents',    icon: FileText,         label: 'Documents'  },
  { to: '/dashboard/contacts',     icon: Users,            label: 'Contacts'   },
  { to: '/dashboard/companies',    icon: Building2,        label: 'Companies'  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${mobile ? 'w-64' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">S</span>
        </div>
        <span className="text-xl font-bold text-gray-900">Signflow</span>
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
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100">
  <div className="flex items-center gap-3 px-3 py-2">
    <button
      onClick={() => setProfileOpen(true)}
      className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0 hover:ring-2 hover:ring-indigo-400 transition-all"
      title="Edit profile"
    >
      {getInitials(user?.name)}
    </button>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
    </div>
    <button onClick={handleLogout} title="Logout"
      className="text-gray-400 hover:text-red-500 transition-colors">
      <LogOut size={16} />
    </button>
  </div>
</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />


      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-900">Signflow</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}