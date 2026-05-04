import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { AuditLogTimeline as AuditLog } from '@/components/document/AuditLog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate, getInitials, classNames } from '@/utils/helpers';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { 
  FileText, Edit3, XCircle, Download, CheckCircle, 
  History, Clock, User, Building, Calendar, DownloadCloud, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelModal, setCancelModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn:  () => documentApi.get(id),
  });

  const cancelMut = useMutation({
    mutationFn: () => documentApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Document cancelled.');
      setCancelModal(false);
    },
  });

  const doc = data?.data?.document;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-gray-500 animate-pulse">Loading document details...</p>
    </div>
  );
  
  if (!doc) return (
    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 my-12 mx-auto max-w-md shadow-sm">
      <FileText size={48} className="mx-auto text-gray-200 dark:text-slate-800 mb-4" />
      <p className="text-gray-900 dark:text-white font-bold text-lg">Document not found</p>
      <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">This document may have been deleted or moved.</p>
      <Button variant="secondary" className="mt-6 rounded-xl" onClick={() => navigate('/dashboard/documents')}>Back to Documents</Button>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Info */}
        <div className="flex-1 space-y-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={classNames('font-black uppercase tracking-tighter', STATUS_COLORS[doc.status])}>{STATUS_LABELS[doc.status]}</Badge>
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">ID: {doc.id}</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white truncate tracking-tight">{doc.title}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 font-medium max-w-2xl">{doc.description || 'No description provided for this document.'}</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {doc.is_editable && (
                <Link to={`/dashboard/documents/${id}/editor`}>
                  <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20"><Edit3 size={18} />Edit Fields</Button>
                </Link>
              )}
              {doc.status === 'in_progress' && (
                <Button variant="danger" size="lg" className="rounded-xl shadow-lg shadow-red-500/10" onClick={() => setCancelModal(true)}><XCircle size={18} />Cancel Request</Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Signers */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="px-8 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/30">
                <h2 className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">Signers ({doc.signers?.length || 0})</h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Mode:</span>
                  <Badge size="xs" variant="gray" className="font-black uppercase tracking-tighter">{doc.signing_mode}</Badge>
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-800 flex-1">
                {doc.signers?.map(s => (
                  <div key={s.id} className="px-8 py-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 truncate mt-0.5">{s.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.signed_at ? (
                        <div className="flex flex-col items-end">
                          <Badge variant="emerald" size="xs" className="font-black uppercase tracking-tighter">Signed</Badge>
                          <span className="text-[9px] text-gray-400 dark:text-slate-600 mt-1 font-bold">{formatDate(s.signed_at)}</span>
                        </div>
                      ) : (
                        <Badge variant="gray" size="xs" className="font-black uppercase tracking-tighter">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Details / Files */}
            <div className="space-y-8 flex flex-col">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm p-8 flex-1">
                <h2 className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-6">Files & Metadata</h2>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-slate-700">
                        <FileText size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Original Document</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium uppercase mt-0.5">{doc.file?.size_formatted}</p>
                      </div>
                    </div>
                    <a href={doc.file?.original_url} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all"><Download size={16} /></Button>
                    </a>
                  </div>

                  {doc.status === 'completed' && doc.file?.signed_url && (
                    <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle size={20} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400">Signed Document</p>
                          <p className="text-[10px] text-emerald-600/60 dark:text-emerald-500/50 font-black uppercase mt-0.5">Verified & Sealed</p>
                        </div>
                      </div>
                      <a href={doc.file.signed_url} target="_blank" rel="noreferrer">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 shadow-lg shadow-emerald-500/20"><Download size={16} />Download</Button>
                      </a>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-50 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                        <Calendar size={12} /> Created On
                      </div>
                      <span className="font-bold text-gray-700 dark:text-slate-300">{formatDate(doc.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                        <User size={12} /> Owner
                      </div>
                      <span className="font-bold text-gray-700 dark:text-slate-300">{doc.user?.name}</span>
                    </div>
                    {doc.company && (
                      <div className="flex justify-between items-center text-xs">
                         <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                          <Building size={12} /> Company
                        </div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{doc.company.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline / Audit Log Sidebar */}
        <div className="w-full lg:w-96 space-y-8 h-full">
           <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm p-8 flex flex-col h-full min-h-[500px]">
            <h2 className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <History size={14} className="text-indigo-500" /> Document History
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-100 dark:scrollbar-thumb-slate-800">
              <AuditLog documentId={id} />
            </div>
           </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelModal} onClose={() => setCancelModal(false)}
        onConfirm={() => cancelMut.mutate()}
        loading={cancelMut.isPending}
        title="Cancel signing request?"
        message="This will invalidate all current signing links. This action cannot be undone."
        confirmLabel="Cancel Request"
      />
    </div>
  );
}
