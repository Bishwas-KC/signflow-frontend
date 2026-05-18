import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { getInitials } from '@/utils/helpers';
import toast from 'react-hot-toast';

export function ProfileModal({ open, onClose }) {
 const { user, saveSession } = useAuth();
 const token = localStorage.getItem('token');

 const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
 defaultValues: { name: user?.name || '', phone: user?.phone || '' },
 });

 const onSubmit = async (data) => {
 try {
 const res = await authApi.updateProfile(data);
 saveSession(res.data.user, token);
 toast.success('Profile updated.');
 onClose();
 } catch (err) {
 toast.error(err.response?.data?.error?.message || 'Failed to update profile.');
 }
 };

 return (
 <Modal open={open} onClose={onClose} title="Edit Profile" size="sm">
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
 {/* Avatar */}
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
 {user?.avatar
 ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
 : getInitials(user?.name)
 }
 </div>
 <div>
 <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
 <p className="text-xs text-gray-500">{user?.email}</p>
 {user?.has_google && (
 <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
 Google account
 </span>
 )}
 </div>
 </div>

 <Input
 label="Full Name"
 error={errors.name?.message}
 {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
 />

 <Input
 label="Phone Number"
 placeholder="+977-98XXXXXXXX"
  {...register('phone')}
 />

 <div className="flex gap-3">
 <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
 <Button type="submit" loading={isSubmitting} className="flex-1">Save Changes</Button>
 </div>
 </form>
 </Modal>
 );
}