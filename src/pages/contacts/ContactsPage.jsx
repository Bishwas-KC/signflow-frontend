import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { contactApi } from '@/api/contact.api';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SIGN_ROLES } from '@/utils/constants';
import { getInitials, classNames } from '@/utils/helpers';
import { UserPlus, Users, Search, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { keepPreviousData } from '@tanstack/react-query';


function ContactForm({ contact, onSuccess, onClose }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: contact || { sign_role: 'signer' },
  });

  const save = async (data) => {
    try {
      if (contact) await contactApi.update(contact.id, data);
      else         await contactApi.create(data);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save contact.');
    }
  };

  return (
    <form onSubmit={handleSubmit(save)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Full Name *" placeholder="John Doe"
            error={errors.full_name?.message}
            {...register('full_name', { required: 'Name is required' })} />
        </div>
        <Input label="Email" type="email" placeholder="john@example.com" {...register('email')} />
        <Input label="Phone" placeholder="+977-98..." {...register('phone')} />
        <Input label="Company" placeholder="TechCorp Nepal" {...register('company_name')} />
        <Input label="Designation" placeholder="CEO" {...register('designation')} />
        <Input label="PAN Number" placeholder="600123456" {...register('pan_number')} />
        <Select label="Sign Role *" {...register('sign_role', { required: true })}>
          {SIGN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          {contact ? 'Save Changes' : 'Add Contact'}
        </Button>
      </div>
    </form>
  );
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [modal, setModal]       = useState(null); // null | 'create' | contact
  const [deleteTarget, setDelete] = useState(null);
  const [search, setSearch]     = useState('');
  const [role, setRole]         = useState('');
  const [page, setPage]         = useState(1);

  const { data: statsData } = useQuery({
    queryKey: ['contact-stats'],
    queryFn:  contactApi.stats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search, role, page }],
    queryFn:  () => contactApi.list({ search, role, page, per_page: 12 }),
    placeholderData: keepPreviousData,   // ← same fix
});

  const deleteMut = useMutation({
    mutationFn: (id) => contactApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success('Contact deleted.');
      setDelete(null);
    },
  });

  const onFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['contact-stats'] });
    toast.success(modal?.id ? 'Contact updated.' : 'Contact added.');
    setModal(null);
  };

  const stats = statsData?.data?.stats || {};
  const contacts = data?.data || [];
  const meta = data?.meta || {};

  const roleColor = (role) => SIGN_ROLES.find(r => r.value === role)?.color || '';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Contacts"
        description="Maintain a directory of your frequent signers and partners."
        action={
          <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20" onClick={() => setModal('create')}>
            <UserPlus size={18} />Add Contact
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {SIGN_ROLES.map(r => (
          <div key={r.value} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center">
            <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stats[r.value] ?? 0}</p>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{r.label}s</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search contacts by name or email…"
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-slate-200 shadow-sm transition-all"
          />
        </div>
        <select
          value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
        >
          <option value="">All Signing Roles</option>
          {SIGN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : contacts.length === 0 ? (
        <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
          <EmptyState
            icon={Users}
            title="No contacts found"
            description={search || role ? 'Try adjusting your search criteria.' : 'Add your first contact to streamline your signing workflow.'}
            action={!search && !role && (
              <Button variant="secondary" className="rounded-xl" onClick={() => setModal('create')}><UserPlus size={16} />Add Contact</Button>
            )}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold text-gray-900 dark:text-white text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{c.full_name}</p>
                    <Badge size="xs" className={classNames('font-black uppercase tracking-tighter', roleColor(c.sign_role))}>{c.role_label}</Badge>
                  </div>
                  {c.email && <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{c.email}</p>}
                  {c.company_name && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium truncate">{c.company_name}</p>}
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-5 border-t border-gray-50 dark:border-slate-800/50">
                <button
                  onClick={() => setModal(c)}
                  className="flex-1 text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
                >
                  <Edit3 size={14} />Edit
                </button>
                <button
                  onClick={() => setDelete(c)}
                  className="flex-1 text-xs font-bold text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-slate-800 transition-all"
                >
                  <Trash2 size={14} />Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Page {meta.current_page} of {meta.last_page}</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="rounded-lg" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" className="rounded-lg" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Contact' : 'Add Contact'}>
        <ContactForm contact={modal?.id ? modal : null} onSuccess={onFormSuccess} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDelete(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        loading={deleteMut.isPending}
        title="Delete contact?"
        message={`"${deleteTarget?.full_name}" will be removed from your contacts.`}
        confirmLabel="Delete"
      />
    </div>
  );
}