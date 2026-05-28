import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { contactApi } from '@/api/contact.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { getInitials } from '@/utils/helpers';
import {
  UserPlus, Users, Search, Trash2, Edit3, Mail, Briefcase, Phone,
  ChevronLeft, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import toast from 'react-hot-toast';
import { keepPreviousData } from '@tanstack/react-query';

const PER_PAGE = 12;

function ContactForm({ contact, onSuccess, onClose }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: contact || {},
  });

  const save = async (data) => {
    try {
      if (contact) await contactApi.update(contact.id, { ...data, sign_role: 'signer' });
      else await contactApi.create({ ...data, sign_role: 'signer' });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save contact.');
    }
  };

  return (
    <form onSubmit={handleSubmit(save)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input label="Full Name *" placeholder="John Doe"
            error={errors.full_name?.message}
            {...register('full_name', { required: 'Name is required' })} />
        </div>
        <Input label="Email" type="email" placeholder="john@example.com" {...register('email')} />
        <Input label="Phone" placeholder="+977-98..." {...register('phone')} />
        <Input label="Company" placeholder="TechCorp Nepal" {...register('company_name')} />
        <Input label="Designation" placeholder="CEO" {...register('designation')} />
        <Input label="PAN" placeholder="600123456" {...register('pan_number')} />
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
    <div className="flex items-center justify-between">
      <p className="text-xs text-gray-400 font-medium">
        Page {meta.current_page} of {meta.last_page}
        <span className="hidden sm:inline"> &middot; {meta.total} total</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed bg-gray-50 hover:bg-gray-100 disabled:bg-transparent rounded-lg transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-11 h-11 text-xs font-bold rounded-lg transition-all ${
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
          className="w-11 h-11 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed bg-gray-50 hover:bg-gray-100 disabled:bg-transparent rounded-lg transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function ContactSkeleton({ view }) {
  if (view === 'list') {
    return (
      <div className="animate-pulse bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-32" />
                <div className="h-2.5 bg-gray-50 rounded w-48" />
              </div>
              <div className="h-3 bg-gray-50 rounded w-24 hidden sm:block" />
              <div className="h-3 bg-gray-50 rounded w-20 hidden lg:block" />
              <div className="flex gap-2">
                <div className="w-16 h-7 bg-gray-50 rounded-lg" />
                <div className="w-16 h-7 bg-gray-50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: PER_PAGE }, (_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="h-2.5 bg-gray-50 rounded w-32" />
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-50">
              <div className="flex-1 h-7 bg-gray-50 rounded-lg" />
              <div className="flex-1 h-7 bg-gray-50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactCard({ contact, onEdit, onDelete }) {
  return (
    <div className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all flex flex-col relative">
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black text-sm flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
          {getInitials(contact.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm truncate">{contact.full_name}</h3>
          {contact.email && (
            <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Mail size={11} className="flex-shrink-0" />
              {contact.email}
            </p>
          )}
          {contact.company_name && (
            <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Briefcase size={11} className="flex-shrink-0" />
              {contact.company_name}
              {contact.designation && <span> &middot; {contact.designation}</span>}
            </p>
          )}
          {contact.phone && !contact.company_name && (
            <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Phone size={11} className="flex-shrink-0" />
              {contact.phone}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
        <button
          onClick={() => onEdit(contact)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 sm:py-1.5 text-xs font-semibold text-gray-400 hover:text-indigo-600 bg-transparent hover:bg-indigo-50 rounded-lg transition-all min-h-[44px] sm:min-h-0"
        >
          <Edit3 size={12} /> Edit
        </button>
        <button
          onClick={() => onDelete(contact)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 sm:py-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 bg-transparent hover:bg-red-50 rounded-lg transition-all min-h-[44px] sm:min-h-0"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

function ContactRow({ contact, onEdit, onDelete }) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black text-sm flex-shrink-0 shadow-sm">
            {getInitials(contact.full_name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate max-w-[180px] lg:max-w-[240px]">{contact.full_name}</p>
            {contact.email && (
              <p className="text-xs text-gray-400 truncate max-w-[200px]">{contact.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden sm:table-cell">
        <span className="text-sm text-gray-600">{contact.phone || '—'}</span>
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <span className="text-sm text-gray-600 truncate max-w-[160px] block">{contact.company_name || '—'}</span>
      </td>
      <td className="px-4 py-4 hidden md:table-cell">
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-md leading-none">
          {contact.role_label}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => onEdit(contact)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <Edit3 size={12} /> Edit
          </button>
          <button
            onClick={() => onDelete(contact)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');

  const { data: statsData } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: contactApi.stats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search, page }],
    queryFn: () => contactApi.list({ search, page, per_page: PER_PAGE }),
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Contacts</h1>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full leading-none">
            {stats.total ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-md transition-all ${view === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={15} />
            </button>
          </div>
          <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20 flex-shrink-0" onClick={() => setModal('create')}>
            <UserPlus size={16} /> Add Contact
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, or company..."
          aria-label="Search contacts"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 text-gray-900 transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <ContactSkeleton view={view} />
      ) : contacts.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <EmptyState
            icon={Users}
            title="No contacts found"
            description={search ? 'Try adjusting your search criteria.' : 'Add your first contact to streamline your signing workflow.'}
            action={!search && (
              <Button variant="subtle" className="rounded-xl" onClick={() => setModal('create')}>
                <UserPlus size={16} />Add Contact
              </Button>
            )}
          />
        </div>
      ) : view === 'grid' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contacts.map(c => (
              <ContactCard
                key={c.id}
                contact={c}
                onEdit={setModal}
                onDelete={setDelete}
              />
            ))}
          </div>
          <Pagination meta={meta} page={page} onPageChange={setPage} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-4">Name</th>
                    <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Phone</th>
                    <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Company</th>
                    <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Role</th>
                    <th className="px-5 py-4">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider float-right">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contacts.map(c => (
                    <ContactRow
                      key={c.id}
                      contact={c}
                      onEdit={setModal}
                      onDelete={setDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
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
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? This will delete them from your directory but won't affect past documents.`}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}
