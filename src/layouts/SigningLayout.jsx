import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/shared/Sidebar';

export default function SigningLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen min-h-dynamic bg-gray-50 overflow-x-hidden overflow-y-auto">
      {/* Desktop sidebar */}
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
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all">
            <Menu size={24} />
          </button>
          <span className="font-black text-xl text-gray-900 tracking-tighter">Signflow</span>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pb-16 sm:pb-20">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
