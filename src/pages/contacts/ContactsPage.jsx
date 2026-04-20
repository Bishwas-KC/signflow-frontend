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
import { getInitials } from '@/utils/helpers';
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
    placeholderData: keepPreviousData,

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
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Contacts"
        description="Manage your signing contacts and their roles."
        action={
          <Button onClick={() => setModal('create')}>
            <UserPlus size={16} />Add Contact
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {SIGN_ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats[r.value] ?? 0}</p>
            <p className="text-sm text-gray-500">{r.label}s</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search contacts…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All roles</option>
          {SIGN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description={search || role ? 'Try adjusting your search.' : 'Add your first contact to get started.'}
          action={!search && !role && (
            <Button onClick={() => setModal('create')}><UserPlus size={16} />Add Contact</Button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{c.full_name}</p>
                    <Badge className={roleColor(c.sign_role)}>{c.role_label}</Badge>
                  </div>
                  {c.email && <p className="text-xs text-gray-500 mt-0.5 truncate">{c.email}</p>}
                  {c.company_name && <p className="text-xs text-gray-400 truncate">{c.company_name}</p>}
                  {c.designation && <p className="text-xs text-gray-400">{c.designation}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setModal(c)}
                  className="flex-1 text-xs text-gray-600 hover:text-indigo-600 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <Edit3 size={13} />Edit
                </button>
                <button
                  onClick={() => setDelete(c)}
                  className="flex-1 text-xs text-gray-600 hover:text-red-500 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Page {meta.current_page} of {meta.last_page}</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
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