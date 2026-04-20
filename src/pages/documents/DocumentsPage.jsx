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
    defaultValues: { title: '', signing_mode: 'sequential', description: '' },
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
}});
  //   onError: (err) => {
  //     toast.error(err.response?.data?.error?.message || 'Upload failed.');
  //   },
  // });

  const onSubmit = (data) => {
    if (!file) { toast.error('Please select a file.'); return; }
    create.mutate({ data, file });
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

        <Input label="Description (optional)" placeholder="Brief description..." {...register('description')} />

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

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, status, page }],
    queryFn:  () => documentApi.list({ search, status, page, per_page: 10 }),
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
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Documents"
        description="Manage and track all your documents."
        action={<Button onClick={() => setNewModal(true)}><FilePlus size={16} />New Document</Button>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents found"
            description={search || status ? 'Try adjusting your filters.' : 'Upload your first document to get started.'}
            action={!search && !status && <Button onClick={() => setNewModal(true)}><FilePlus size={16} />New Document</Button>}
          />
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Document</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Mode</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Progress</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{doc.title}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">{doc.file?.size_formatted}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-xs capitalize text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        {doc.signing_mode}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${doc.progress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {doc.counts?.signed_count ?? 0}/{doc.counts?.total_signers ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={STATUS_COLORS[doc.status]}>{STATUS_LABELS[doc.status]}</Badge>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Link to={`/dashboard/documents/${doc.id}`} title="View">
                          <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                            <Eye size={15} />
                          </button>
                        </Link>
                        {['draft', 'pending'].includes(doc.status) && (
                          <Link to={`/dashboard/documents/${doc.id}/editor`} title="Edit">
                            <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                              <Edit3 size={15} />
                            </button>
                          </Link>
                        )}
                        {doc.status !== 'in_progress' && (
                          <button
                            onClick={() => setDeleteDoc(doc)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {meta.current_page} of {meta.last_page} · {meta.total} total
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="secondary" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
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
        title="Delete document?"
        message={`"${deleteDoc?.title}" will be permanently deleted.`}
        confirmLabel="Delete"
      />
    </div>
  );
}