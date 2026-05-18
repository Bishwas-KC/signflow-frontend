import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { contactApi } from '@/api/contact.api';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SIGN_ROLES } from '@/utils/constants';
import { getInitials, classNames } from '@/utils/helpers';
import {
  UserPlus, Users, Search, Trash2, Edit3,
  ChevronLeft, ChevronRight, Mail, Briefcase, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { keepPreviousData } from '@tanstack/react-query';

// ── Contact Form Modal ──────────────────────────────────────────────────

function ContactForm({ contact, onSuccess, onClose }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: contact || { sign_role: 'signer' },
  });

  const save = async (data) => {
    try {
      if (contact) await contactApi.update(contact.id, data);
      else await contactApi.create(data);
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
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1 rounded-xl">
          {contact ? 'Save Changes' : 'Add Contact'}
        </Button>
      </div>
    </form>
  );
}

// ── Pagination ──────────────────────────────────────────────────────────

function Pagination({ meta, page, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const pages = [];
  const total = meta.last_page;
  const current = meta.current_page;

  let start = Math.max(1, current - 1);
  let end = Math.min(total, current + 1);
  if (current <= 2) { end = Math.min(3, total); }
  if (current >= total - 1) { start = Math.max(1, total - 2); }
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl border border-gray-200/70 shadow-sm">
      <p className="text-xs text-gray-400 font-medium">
        Page {meta.current_page} of {meta.last_page}
        <span className="hidden sm:inline"> &middot; {meta.total} total</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed bg-gray-50 hover:bg-gray-100 disabled:bg-transparent rounded-lg transition-all"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
              p === current
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= meta.last_page}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed bg-gray-50 hover:bg-gray-100 disabled:bg-transparent rounded-lg transition-all"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────

function ContactSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200/70 p-5 space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl" />
              <div className="space-y-2 w-full">
                <div className="h-3 bg-gray-100 rounded w-24 mx-auto" />
                <div className="h-2 bg-gray-50 rounded w-32 mx-auto" />
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-50">
              <div className="flex-1 h-8 bg-gray-50 rounded-xl" />
              <div className="flex-1 h-8 bg-gray-50 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const { data: statsData } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: contactApi.stats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search, role, page }],
    queryFn: () => contactApi.list({ search, role, page, per_page: 12 }),
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Maintain a directory of your frequent signers and partners.</p>
        </div>
        <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20 flex-shrink-0" onClick={() => setModal('create')}>
          <UserPlus size={18} /> Add Contact
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {SIGN_ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-2xl border border-gray-200/70 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-indigo-200/50 transition-all">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={22} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats[r.value] ?? 0}</p>
              <p className="text-xs text-gray-500 font-medium">{r.label}s</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search contacts by name or email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 text-gray-900 transition-all placeholder:text-gray-400"
          />
        </div>
        <select
          value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all appearance-none cursor-pointer"
        >
          <option value="">All Roles</option>
          {SIGN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <ContactSkeleton />
      ) : contacts.length === 0 ? (
        <div className="py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <EmptyState
            icon={Users}
            title="No contacts found"
            description={search || role ? 'Try adjusting your search criteria.' : 'Add your first contact to streamline your signing workflow.'}
            action={!search && !role && (
              <Button variant="subtle" className="rounded-xl" onClick={() => setModal('create')}>
                <UserPlus size={16} />Add Contact
              </Button>
            )}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {contacts.map(c => (
              <div key={c.id} className="group bg-white rounded-2xl border border-gray-200/70 p-5 hover:shadow-lg hover:border-indigo-200/50 transition-all flex flex-col relative">
                <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col items-center text-center flex-1">
                  {/* Avatar */}
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-black text-xl flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm mb-4">
                    {getInitials(c.full_name)}
                  </div>

                  {/* Role badge */}
                  <Badge size="xs" className={classNames('px-2.5 mb-2.5 font-bold leading-none', roleColor(c.sign_role))}>
                    {c.role_label}
                  </Badge>

                  {/* Name */}
                  <h3 className="font-bold text-gray-900 text-sm truncate w-full group-hover:text-indigo-600 transition-colors">{c.full_name}</h3>

                  {/* Details */}
                  <div className="mt-3 w-full space-y-1">
                    {c.email && (
                      <p className="text-[11px] text-gray-400 truncate flex items-center justify-center gap-1">
                        <Mail size={11} className="flex-shrink-0" />
                        {c.email}
                      </p>
                    )}
                    {c.company_name && (
                      <p className="text-[11px] text-gray-400 truncate flex items-center justify-center gap-1">
                        <Briefcase size={11} className="flex-shrink-0" />
                        {c.company_name}
                      </p>
                    )}
                    {c.phone && (
                      <p className="text-[11px] text-gray-400 truncate flex items-center justify-center gap-1">
                        <Phone size={11} className="flex-shrink-0" />
                        {c.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setModal(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setDelete(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-500 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination meta={meta} page={page} onPageChange={setPage} />
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Contact' : 'Add Contact'} size="lg">
        <ContactForm contact={modal?.id ? modal : null} onSuccess={onFormSuccess} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDelete(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        loading={deleteMut.isPending}
        title="Delete Contact?"
        message={`Are you sure you want to remove "${deleteTarget?.full_name}"? This will remove them from your directory but won't affect past documents.`}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}
