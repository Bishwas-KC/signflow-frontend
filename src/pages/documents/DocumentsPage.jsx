import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import { companyApi } from '@/api/company.api';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FileUpload } from '@/components/shared/FileUpload';
import { DocumentCard } from '@/components/document/DocumentCard';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';
import {
  FilePlus, FileText, Trash2, Eye, Edit3, Search,
  LayoutGrid, List, RotateCcw,
  Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

function NewDocumentModal({ open, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmClose, setConfirmClose] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors, isDirty } } = useForm({
    defaultValues: { title: '', signing_mode: 'sequential', description: '', file: null },
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
      toast.success(res.message||'Document uploaded! Now add signers and place fields.');
      onClose();
      reset();
      setFile(null);
      navigate(`/dashboard/documents/${res.data.id}/editor`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Upload failed.');
    },
  });

  const onSubmit = (data) => {
    if (!data.file) { toast.error('Please select a file.'); return; }
    const payload = { ...data };
    const file = data.file;
    delete payload.file;
    create.mutate({ data: payload, file });
  };

  return (
    <>
      <Modal open={open} onClose={handleClose} title="New Document" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Controller
            name="file"
            control={control}
            render={({ field }) => (
              <FileUpload value={field.value} onChange={field.onChange} label="Document File *" />
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Document Title *" placeholder="e.g. Partnership Agreement"
              error={errors.title?.message} {...register('title', { required: 'Title is required' })} />
            <Input label="Description (optional)" placeholder="Brief description..." {...register('description')} />
          </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Upload File * (PDF, DOC, DOCX — max 20MB)</label>
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
            </div>

            {companies?.data?.length > 0 && (
              <Select label="Company (optional)" {...register('company_id')}>
                <option value="">No company</option>
                {companies.data.map(c => (
                  <option key={c.id} value={c.id}>{c.info?.name || c.name || 'Unnamed Company'}</option>
                ))}
              </Select>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-50">
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1 rounded-xl">Cancel</Button>
            <Button type="submit" loading={create.isPending} className="flex-1 rounded-xl">Upload & Continue</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={handleConfirmClose}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
      />
    </>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────

function Pagination({ meta, page, onPageChange, perPage, onPerPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const pages = [];
  const total = meta.last_page;
  const current = meta.current_page;

  let start = Math.max(1, current - 1);
  let end = Math.min(total, current + 1);
  if (current <= 2) { end = Math.min(3, total); }
  if (current >= total - 1) { start = Math.max(1, total - 2); }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-4 bg-white rounded-2xl border border-gray-200/70 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Show</span>
          <select
            value={perPage}
            onChange={e => onPerPageChange(Number(e.target.value))}
            className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
          <span className="text-xs text-gray-400">per page</span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          Page {meta.current_page} of {meta.last_page}
          <span className="hidden sm:inline"> &middot; {meta.total} total</span>
        </p>
      </div>
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

// ── Loading Skeleton ──────────────────────────────────────────────────────

function DocSkeleton({ view }) {
  if (view === 'list') {
    return (
      <div className="animate-pulse bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-40" />
                <div className="h-2.5 bg-gray-50 rounded w-24" />
              </div>
              <div className="h-5 w-20 bg-gray-100 rounded-md hidden sm:block" />
              <div className="h-5 w-16 bg-gray-50 rounded-md hidden sm:block" />
              <div className="h-2 bg-gray-50 rounded w-16 hidden md:block" />
              <div className="h-3 bg-gray-50 rounded w-12 hidden lg:block" />
              <div className="h-3 bg-gray-50 rounded w-16 hidden lg:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200/70 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-2 bg-gray-50 rounded w-1/2" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-2 bg-gray-50 rounded w-16" />
              <div className="h-2 bg-gray-50 rounded w-12" />
              <div className="h-2 bg-gray-50 rounded w-14" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2 bg-gray-50 rounded w-full" />
              <div className="h-1.5 bg-gray-100 rounded-full" />
            </div>
            <div className="h-9 bg-gray-50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [newModal, setNewModal] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [view, setView] = useState('list');

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  useEffect(() => {
    if (location.state?.openNewModal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, status, page }],
    queryFn:  () => documentApi.list({ search, status, page, per_page: 10 }),
    keepPreviousData: true,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => documentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted.');
      setDeleteDoc(null);
    },
  });

  const restoreMut = useMutation({
    mutationFn: (id) => documentApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document restored.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to restore document.');
    },
  });

  const docs = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Documents</h1>
          {status !== 'deleted' ? (
            <p className="text-sm text-gray-500 mt-1">Manage and track your signature requests.</p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">View and restore your archived documents.</p>
          )}
        </div>
        {status !== 'deleted' && (
        <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20 flex-shrink-0" onClick={() => setNewModal(true)}>
          <FilePlus size={18} /> New Document
        </Button>
        )}
      </div>

      {/* Quick stats */}
      {docs.length > 0 && status !== 'deleted' && (
        <QuickStats docs={docs} />
      )}

      {/* Active / Archived toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setStatus(''); setPage(1); setRole('all'); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            status !== 'deleted' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => { setStatus('deleted'); setPage(1); setRole('all'); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            status === 'deleted' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Archived
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search documents..."
            aria-label="Search documents"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 text-gray-900 transition-all placeholder:text-gray-400"
          />
        </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              {status !== 'deleted' && (
              <select
                value={role}
                onChange={e => { setRole(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="owner">My Documents</option>
                <option value="signer">Signing Requests</option>
              </select>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {status !== 'deleted' && (
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all appearance-none cursor-pointer"
              >
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              )}
            </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <DocSkeleton view={view} />
      ) : docs.length === 0 ? (
        <div className="py-10 sm:py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <EmptyState
            icon={FileText}
            title="No documents found"
            description={
              search || status
                ? 'Try adjusting your filters to find what you are looking for.'
                : 'Upload your first document to start the signing process.'
            }
            action={
              !search && !status && (
                <Button variant="subtle" className="rounded-xl" onClick={() => setNewModal(true)}>
                  <FilePlus size={16} />New Document
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {docs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onDelete={setDeleteDoc} onRestore={(d) => restoreMut.mutate(d.id)} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 sm:px-5 py-4">Document</th>
                      <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Mode</th>
                      <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Status</th>
                      <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Progress</th>
                      <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Signers</th>
                      <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Created</th>
                      <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 sm:px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {docs.map(doc => {
                      const cfg = STATUS_CONFIG[doc.status];
                      const Icon = cfg?.icon || FileText;
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 sm:px-5 py-4">
                            <Link to={`/dashboard/documents/${doc.id}`} className="flex items-center gap-3 group/cell">
                              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/cell:scale-110 transition-transform text-indigo-500">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate max-w-[160px] lg:max-w-[240px] group-hover/cell:text-indigo-600 transition-colors">
                                  {doc.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {doc.role === 'signer' && (
                                    <span className="text-xs font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200/50 leading-none">Signer</span>
                                  )}
                                  <span className="text-xs text-gray-400 font-medium">{doc.file?.size_formatted}</span>
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell">
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-md leading-none capitalize">
                              {doc.signing_mode}
                            </span>
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell">
                            <Badge size="xs" className={`font-bold leading-none ${STATUS_COLORS[doc.status]}`}>
                              {STATUS_LABELS[doc.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell">
                            <div className="flex items-center gap-3">
                              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                                  style={{ width: `${doc.progress ?? 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-400">{doc.progress ?? 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <span className="text-sm font-medium text-gray-600">
                              {doc.counts?.signed_count ?? 0}/{doc.counts?.total_signers ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <span className="text-sm text-gray-400 font-medium">{formatDate(doc.created_at)}</span>
                          </td>
                          <td className="px-3 sm:px-5 py-4">
                            <div className="flex items-center gap-1 justify-end">
                              <Link
                                to={`/dashboard/documents/${doc.id}`}
                                className="p-3 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                                title="View details"
                              >
                                <Eye size={15} />
                              </Link>
                              {['draft', 'pending'].includes(doc.status) && (
                                <Link
                                  to={`/dashboard/documents/${doc.id}/editor`}
                                  className="p-3 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                                  title="Edit fields"
                                >
                                  <Edit3 size={15} />
                                </Link>
                              )}
                              {doc.can_delete && (
                                <button
                                  onClick={() => setDeleteDoc(doc)}
                                  className="p-3 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                              {doc.can_restore && (
                                <button
                                  onClick={() => restoreMut.mutate(doc.id)}
                                  className="p-3 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-all"
                                  title="Restore"
                                >
                                  <RotateCcw size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Pagination meta={meta} page={page} onPageChange={setPage} perPage={perPage} onPerPageChange={handlePerPageChange} />
        </div>
      )}

      <NewDocumentModal open={newModal} onClose={() => setNewModal(false)} />
      <ConfirmDialog
        open={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={() => deleteMut.mutate(deleteDoc.id)}
        loading={deleteMut.isPending}
        title="Delete Document?"
        message={`This action cannot be undone. "${deleteDoc?.title}" and its signature data will be permanently removed.`}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}
