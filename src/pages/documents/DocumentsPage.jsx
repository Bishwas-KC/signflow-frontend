import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import { companyApi } from '@/api/company.api';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FileUpload } from '@/components/shared/FileUpload';
import { DocumentCard } from '@/components/document/DocumentCard';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, formatFileSize, classNames } from '@/utils/helpers';
import { FilePlus, FileText, Trash2, Eye, Edit3, Search, LayoutGrid, List } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { keepPreviousData } from '@tanstack/react-query';


// ── New Document Modal ────────────────────────────────────────────────────────
function NewDocumentModal({ open, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: { title: '', signing_mode: 'sequential', description: '', expires_at: '', file: null },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => companyApi.list({ per_page: 100 }),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: ({ data, file }) => documentApi.create(data, file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded! Now add signers and place fields.');
      onClose();
      reset();
      navigate(`/dashboard/documents/${res.data.document.id}/editor`);
    },
    onError: (err) => {
      const errorData = err.response?.data;
      const fileError = errorData?.error?.errors?.file?.[0];
      toast.error(fileError || errorData?.error?.message || 'Upload failed.');
    },
  });

  const onSubmit = (data) => {
    if (!data.file) { toast.error('Please select a file.'); return; }

    const payload = {
      ...data,
      expires_at: data.expires_at ? data.expires_at.replace('T', ' ') + ':00' : undefined,
    };
    const file = data.file;
    delete payload.file;

    create.mutate({ data: payload, file });
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload New Document" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input label="Document Title *" placeholder="e.g. Partnership Agreement 2024"
              error={errors.title?.message} {...register('title', { required: 'Title is required' })} />

            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Signing Mode *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'sequential', label: 'Sequential', desc: 'Sign in order' },
                  { value: 'bulk',       label: 'Bulk',       desc: 'Any order' },
                ].map(m => (
                  <label key={m.value} className="relative cursor-pointer">
                    <input type="radio" value={m.value} {...register('signing_mode')} className="sr-only peer" />
                    <div className="border-2 rounded-2xl p-3 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 dark:peer-checked:bg-indigo-900/10 border-gray-100 dark:border-slate-800 transition-all">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{m.label}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {companies?.data?.length > 0 && (
              <Select label="Company (optional)" {...register('company_id')}>
                <option value="">No company</option>
                {companies.data.map(c => (
                  <option key={c.id} value={c.id}>{c.info.name}</option>
                ))}
              </Select>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                {...register('expires_at')}
                min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Description (optional)" placeholder="Brief description..." {...register('description')} />
            
            <Controller
              name="file"
              control={control}
              render={({ field }) => (
                <FileUpload 
                  value={field.value} 
                  onChange={field.onChange} 
                  label="Document File *"
                />
              )}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-50 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
          <Button type="submit" loading={create.isPending} className="flex-1 rounded-xl">Upload & Continue</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [newModal, setNewModal]     = useState(false);
  const [deleteDoc, setDeleteDoc]   = useState(null);
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);
  const [view, setView]             = useState('grid'); // 'grid' or 'list'

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, status, page }],
    queryFn:  () => documentApi.list({ search, status, page, per_page: 12 }),
    placeholderData: keepPreviousData,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => documentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted.');
      setDeleteDoc(null);
    },
  });

  const docs = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Documents"
        description="Manage and track your signature requests."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-1 shadow-sm">
              <button 
                onClick={() => setView('grid')}
                className={classNames('p-2 rounded-lg transition-all', view === 'grid' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600')}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={classNames('p-2 rounded-lg transition-all', view === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600')}
              >
                <List size={18} />
              </button>
            </div>
            <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20" onClick={() => setNewModal(true)}>
              <FilePlus size={18} />New Document
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search documents by title or description…"
            className="w-full pl-11 pr-4 py-3 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 text-gray-900 dark:text-slate-200 shadow-sm transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-gray-200 dark:border-slate-800 rounded-2xl px-6 py-3 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm transition-all appearance-none cursor-pointer"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading documents...</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
          <EmptyState
            icon={FileText}
            title="No documents found"
            description={search || status ? 'Try adjusting your filters to find what you are looking for.' : 'Upload your first document to start the signing process.'}
            action={!search && !status && <Button variant="subtle" className="rounded-xl" onClick={() => setNewModal(true)}><FilePlus size={16} />Create Document</Button>}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {docs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onDelete={setDeleteDoc} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800">
                    <tr>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-8 py-5">Document</th>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-4 py-5 hidden sm:table-cell">Mode</th>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-4 py-5 hidden md:table-cell">Progress</th>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-4 py-5">Status</th>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-4 py-5 hidden lg:table-cell">Created</th>
                      <th className="px-8 py-5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {docs.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 text-indigo-500">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[240px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.title}</p>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-black uppercase tracking-wider">{doc.file?.size_formatted}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-6 hidden sm:table-cell">
                          <Badge size="xs" variant="gray" className="font-black">{doc.signing_mode}</Badge>
                        </td>
                        <td className="px-4 py-6 hidden md:table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-700"
                                style={{ width: `${doc.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500">
                              {doc.counts?.signed_count ?? 0}/{doc.counts?.total_signers ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <Badge size="xs" className={STATUS_COLORS[doc.status]}>{STATUS_LABELS[doc.status]}</Badge>
                        </td>
                        <td className="px-4 py-6 hidden lg:table-cell text-xs font-bold text-gray-400">
                          {formatDate(doc.created_at)}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/dashboard/documents/${doc.id}`} title="View Details">
                              <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <Eye size={16} />
                              </button>
                            </Link>
                            {['draft', 'pending'].includes(doc.status) && (
                              <Link to={`/dashboard/documents/${doc.id}/editor`} title="Open Editor">
                                <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all">
                                  <Edit3 size={16} />
                                </button>
                              </Link>
                            )}
                            {doc.status !== 'in_progress' && (
                              <button
                                onClick={() => setDeleteDoc(doc)}
                                title="Delete Document"
                                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                Page {meta.current_page} of {meta.last_page} · {meta.total} Total
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="secondary" size="sm" className="rounded-xl" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <NewDocumentModal open={newModal} onClose={() => setNewModal(false)} />
      <ConfirmDialog
        open={!!deleteDoc} onClose={() => setDeleteDoc(null)}
        onConfirm={() => deleteMut.mutate(deleteDoc.id)}
        loading={deleteMut.isPending}
        title="Delete Document?"
        message={`This action cannot be undone. "${deleteDoc?.title}" and its signature data will be permanently removed.`}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}