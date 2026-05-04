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
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, formatFileSize } from '@/utils/helpers';
import { FilePlus, FileText, Trash2, Eye, Edit3, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { keepPreviousData } from '@tanstack/react-query';


// ── New Document Modal ────────────────────────────────────────────────────────
function NewDocumentModal({ open, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
  defaultValues: { title: '', signing_mode: 'sequential', description: '', expires_at: '' },
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
      setFile(null);
      navigate(`/dashboard/documents/${res.data.document.id}/editor`);
    },
    onError: (err) => {
  const errorData = err.response?.data;

  // Try to get field-specific error (best UX)
  const fileError = errorData?.error?.errors?.file?.[0];

  toast.error(
    fileError || errorData?.error?.message || 'Upload failed.'
  );
    },
  });

  const onSubmit = (data) => {
  if (!file) { toast.error('Please select a file.'); return; }

  // Format expires_at: datetime-local gives "2025-04-20T14:30" → Laravel needs "2025-04-20 14:30:00"
  const payload = {
    ...data,
    expires_at: data.expires_at ? data.expires_at.replace('T', ' ') + ':00' : undefined,
  };

  create.mutate({ data: payload, file });
};

  return (
    <Modal open={open} onClose={onClose} title="Upload New Document">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Document Title *" placeholder="e.g. Partnership Agreement 2024"
          error={errors.title?.message} {...register('title', { required: 'Title is required' })} />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Signing Mode *</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'sequential', label: 'Sequential', desc: 'Sign in order' },
              { value: 'bulk',       label: 'Bulk',       desc: 'Sign in any order' },
            ].map(m => (
              <label key={m.value} className="relative cursor-pointer">
                <input type="radio" value={m.value} {...register('signing_mode')} className="sr-only peer" />
                <div className="border-2 rounded-xl p-3 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 border-gray-200 transition-colors">
                  <p className="font-medium text-sm text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
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
  <label className="block text-sm font-medium text-gray-700">
    Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
  </label>
  <input
    type="datetime-local"
    {...register('expires_at')}
    min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // min = 1 hour from now
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
  <p className="text-xs text-gray-400">
    After this date, signers will no longer be able to open their signing link.
  </p>
</div>

<Input label="Description (optional)" placeholder="Brief description..." {...register('description')} />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Upload File * (PDF Only — max 20MB)</label>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'
            }`}
            onClick={() => document.getElementById('file-input').click()}
          >
            {file ? (
              <p className="text-sm font-medium text-indigo-700">{file.name} ({formatFileSize(file.size)})</p>
            ) : (
              <div>
                <FileText size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to select file</p>
              </div>
            )}
          </div>
          <input
            id="file-input" type="file" accept=".pdf,.doc,.docx" className="sr-only"
            onChange={e => setFile(e.target.files[0] || null)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={create.isPending} className="flex-1">Upload & Continue</Button>
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

  // Fix the query:
const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, status, page }],
    queryFn:  () => documentApi.list({ search, status, page, per_page: 10 }),
    placeholderData: keepPreviousData,   // ← replaces keepPreviousData: true
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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Documents"
        description="Manage and track your signature requests."
        action={<Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20" onClick={() => setNewModal(true)}><FilePlus size={18} />New Document</Button>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search documents by title…"
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 text-gray-900 dark:text-slate-200 shadow-sm transition-all"
          />
        </div>
        <select
          value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : docs.length === 0 ? (
          <div className="py-20">
            <EmptyState
              icon={FileText}
              title="No documents found"
              description={search || status ? 'Try adjusting your filters.' : 'Upload your first document to get started.'}
              action={!search && !status && <Button variant="secondary" className="rounded-xl" onClick={() => setNewModal(true)}><FilePlus size={16} />New Document</Button>}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest px-8 py-4">Document</th>
                    <th className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest px-4 py-4 hidden sm:table-cell">Mode</th>
                    <th className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest px-4 py-4 hidden md:table-cell">Progress</th>
                    <th className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest px-4 py-4">Status</th>
                    <th className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest px-4 py-4 hidden lg:table-cell">Created</th>
                    <th className="px-8 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {docs.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                            <FileText size={20} className="text-indigo-500 dark:text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[240px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.title}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium hidden sm:block">{doc.file?.size_formatted}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 hidden sm:table-cell">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          {doc.signing_mode}
                        </span>
                      </td>
                      <td className="px-4 py-5 hidden md:table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
                              style={{ width: `${doc.progress ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
                            {doc.counts?.signed_count ?? 0}/{doc.counts?.total_signers ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <Badge className={STATUS_COLORS[doc.status]}>{STATUS_LABELS[doc.status]}</Badge>
                      </td>
                      <td className="px-4 py-5 hidden lg:table-cell text-xs font-medium text-gray-500 dark:text-slate-500">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/dashboard/documents/${doc.id}`} title="View Details">
                            <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                              <Eye size={16} />
                            </button>
                          </Link>
                          {['draft', 'pending'].includes(doc.status) && (
                            <Link to={`/dashboard/documents/${doc.id}/editor`} title="Open Editor">
                              <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                                <Edit3 size={16} />
                              </button>
                            </Link>
                          )}
                          {doc.status !== 'in_progress' && (
                            <button
                              onClick={() => setDeleteDoc(doc)}
                              title="Delete Document"
                              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all"
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

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30">
                <p className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">
                  Page {meta.current_page} of {meta.last_page} · {meta.total} Total
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="rounded-lg" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="secondary" size="sm" className="rounded-lg" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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