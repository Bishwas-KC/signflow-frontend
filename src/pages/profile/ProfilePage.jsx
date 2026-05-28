import { ProfileContent } from '@/components/shared/ProfileContent';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your profile, security, and signatures</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl">
        <ProfileContent />
      </div>
    </div>
  );
}
