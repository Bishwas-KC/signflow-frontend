import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { authApi } from '@/api/auth.api';
import { signApi } from '@/api/sign.api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getInitials } from '@/utils/helpers';
import toast from 'react-hot-toast';
import {
  Lock, Trash2, Camera,
  Bookmark, PenLine, Type, Upload,
  User, Shield,
} from 'lucide-react';
import { DrawTab, TypeTab, UploadTab } from '@/components/shared/SignatureTabs';

export function ProfileContent() {
  const { user, saveSession } = useAuth();
  const token = localStorage.getItem('token');

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const [activeTab, setActiveTab] = useState('info');
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const [savedSignatures, setSavedSignatures] = useState([]);
  const [loadingSigs, setLoadingSigs] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  const [sigTab, setSigTab] = useState('upload');
  const [signatureData, setSignatureData] = useState(null);
  const [sigResetKey, setSigResetKey] = useState(0);

  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchSignatures = useCallback(async () => {
    setLoadingSigs(true);
    try {
      const res = await signApi.getSavedSignatures();
      setSavedSignatures(res.data || []);
    } catch {
      // Silently ignore — signatures are non-critical
    } finally {
      setLoadingSigs(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSignatures();
    setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    setPasswordErrors({});
    setSignatureData(null);
  }, [fetchSignatures]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const onSubmit = async (data) => {
    try {
      const res = await authApi.updateProfile(data);
      saveSession(res.data.user, token);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});
    const errors = {};
    if (!passwordForm.current_password) errors.current_password = 'Current password is required.';
    if (!passwordForm.new_password) errors.new_password = 'New password is required.';
    else if (passwordForm.new_password.length < 8) errors.new_password = 'Min 8 characters.';
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      errors.new_password_confirmation = 'Passwords do not match.';
    }
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword(passwordForm);
      toast.success('Password changed successfully.');
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to change password.';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureData || savingSignature) return;
    setSavingSignature(true);
    try {
      await signApi.saveNewSignature(signatureData);
      toast.success('Signature saved to your account.');
      setSignatureData(null);
      setSigResetKey(k => k + 1);
      fetchSignatures();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save signature.');
    } finally {
      setSavingSignature(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setUploadingAvatar(true);
    try {
      const res = await authApi.uploadAvatar(file);
      saveSession(res.data.user, token);
      toast.success('Profile picture updated.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload avatar.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleDeleteSignature = async (id) => {
    try {
      await signApi.deleteSignature(id);
      setSavedSignatures(prev => prev.filter(s => s.id !== id));
      toast.success('Signature deleted.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete signature.');
    }
  };

  const sigTabs = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'draw', label: 'Draw', icon: PenLine },
    { key: 'type', label: 'Type', icon: Type },
  ];

  const tabs = [
    { key: 'info', label: 'Personal Info', icon: User },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'signatures', label: 'Signatures', icon: PenLine },
  ];

  return (
    <div>
      {/* ── Tab Bar ── */}
      <div role="tablist" className="flex gap-1 p-1 bg-gray-100/80 rounded-xl mb-6 overflow-x-auto scrollbar-thin">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 sm:py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all cursor-pointer font-inherit flex-1 sm:flex-none justify-center ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Personal Info Tab ── */}
      {activeTab === 'info' && (
        <form role="tabpanel" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Card */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile Picture</h3>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl overflow-hidden hover:ring-2 hover:ring-indigo-400 transition-all group relative"
                >
                  {(avatarPreview || user?.avatar)
                    ? <img src={avatarPreview || user.avatar} alt={user?.name} className="w-full h-full rounded-full object-cover" />
                    : getInitials(user?.name)
                  }
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={18} className="text-white" />
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center pointer-events-none">
                  <PenLine size={10} className="text-gray-500" />
                </div>
                <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                {user?.has_google && (
                  <span className="inline-block mt-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Sign in with Google</span>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-4 max-w-md">
              <Input
                label="Full Name"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
              />
              <Input label="Phone Number" placeholder="+977-98XXXXXXXX" {...register('phone')} />
              <div className="flex justify-end pt-1">
                <Button type="submit" loading={isSubmitting}>Save Changes</Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <div role="tabpanel" className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
          {!user?.has_password ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield size={24} className="text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Signed in with Google</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                You signed in using your Google account. Password management is handled by Google.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <Input
                  label="Current Password"
                  type="password"
                  error={passwordErrors.current_password}
                  value={passwordForm.current_password}
                  onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
                />
                <Input
                  label="New Password"
                  type="password"
                  error={passwordErrors.new_password}
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  error={passwordErrors.new_password_confirmation}
                  value={passwordForm.new_password_confirmation}
                  onChange={e => setPasswordForm(p => ({ ...p, new_password_confirmation: e.target.value }))}
                />
                <div className="flex justify-end pt-1">
                  <Button type="button" loading={changingPassword} onClick={handleChangePassword}>
                    <Lock size={14} /> Update Password
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Signatures Tab ── */}
      {activeTab === 'signatures' && (
        <div role="tabpanel" className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">My Signatures</h3>

          {/* Saved Signatures */}
          {loadingSigs ? (
            <p className="text-xs text-gray-400 mb-4">Loading signatures...</p>
          ) : savedSignatures.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-6">
              {savedSignatures.map(sig => (
                <div key={sig.id} className="relative group">
                  <div className="w-36 h-20 border border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1.5">
                    {sig.data_uri ? (
                      <img src={sig.url} alt={sig.label || 'Signature'} onError={(e) => { e.target.onerror = null; e.target.src = sig.data_uri || ''; }} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400">No preview</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSignature(sig.id)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-6">No saved signatures found</p>
          )}

          {/* Signature Creation */}
          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Create New Signature</h4>
            {/* Tabs */}
            <div role="tablist" className="flex gap-1 p-1 bg-gray-100/80 rounded-lg mb-3">
              {sigTabs.map(t => {
                const Icon = t.icon;
                const active = sigTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => { setSigTab(t.key); setSignatureData(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-inherit min-h-[44px] ${
                      active
                        ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Icon size={13} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div role="tabpanel" className="min-h-[200px]">
              {sigTab === 'draw' && <DrawTab key={`draw-${sigResetKey}`} onSignatureReady={setSignatureData} signatureData={signatureData} />}
              {sigTab === 'type' && <TypeTab key={`type-${sigResetKey}`} onSignatureReady={setSignatureData} signatureData={signatureData} />}
              {sigTab === 'upload' && <UploadTab key={`upload-${sigResetKey}`} onSignatureReady={setSignatureData} signatureData={signatureData} />}
            </div>

            {/* Save Button */}
            <div className="mt-4 flex flex-col items-end gap-1.5">
              {savedSignatures.length >= 6 && (
                <p className="text-xs text-amber-600">Maximum 6 signatures allowed.</p>
              )}
              <Button
                type="button"
                size="sm"
                loading={savingSignature}
                disabled={!signatureData || savedSignatures.length >= 6}
                onClick={handleSaveSignature}
              >
                <Bookmark size={14} /> Save to Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
