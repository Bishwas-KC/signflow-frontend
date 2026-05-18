import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
} from 'lucide-react';
import { getInitials } from '@/utils/helpers';
import { ProfileModal } from '@/components/shared/ProfileModal';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/documents', icon: FileText, label: 'Documents' },
  { to: '/dashboard/contacts', icon: Users, label: 'Contacts' },
  { to: '/dashboard/companies', icon: Building2, label: 'Companies' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => {
    const isCollapsed = !mobile && collapsed;

    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-100 group">
        {/* Logo / Expand button */}
        <div className={`flex items-center py-8 ${isCollapsed ? 'justify-center relative' : 'gap-3 pl-3 pr-4'}`}>
          {isCollapsed ? (
            <>
              <div className="w-10 h-10 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 transition-opacity duration-200 group-hover:opacity-0">
                <span className="text-white font-black text-xl">S</span>
              </div>
              {!mobile && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Expand sidebar"
                >
                  <PanelLeftClose size={20} className="rotate-180" />
                </button>
              )}
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tighter whitespace-nowrap">Signflow</span>
              {!mobile && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="ml-auto w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose size={20} />
                </button>
              )}
              {mobile && (
                <button onClick={() => setSidebarOpen(false)} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                  <X size={20} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          <p className={`px-3 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Main Menu</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl whitespace-nowrap h-12 ${
                  isCollapsed
                    ? 'justify-center px-0 mx-auto w-12'
                    : 'gap-3 px-3 text-sm font-bold'
                } ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="py-4 border-t border-gray-100">
          <div className={`flex flex-col items-center gap-3 ${isCollapsed ? '' : 'px-4'}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'gap-3 w-full'}`}>
              <button
                onClick={() => setProfileOpen(true)}
                className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-indigo-700 font-black text-xs flex-shrink-0 hover:border-indigo-400 transition-all shadow-sm group"
                title={isCollapsed ? 'Edit profile' : undefined}
              >
                <span className="group-hover:scale-110 transition-transform">{getInitials(user?.name)}</span>
              </button>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate leading-tight">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 truncate font-semibold uppercase tracking-wider">{user?.email?.split('@')[0]}</p>
                  </div>
                  <button onClick={handleLogout} title="Logout"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90">
                    <LogOut size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar wrapper — this transitions width */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}>
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
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all">
            <Menu size={24} />
          </button>
          <span className="font-black text-xl text-gray-900 tracking-tighter">Signflow</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <div className="min-h-full pb-20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
