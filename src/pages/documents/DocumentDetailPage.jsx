import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { AuditLogTimeline as AuditLog } from '@/components/document/AuditLog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SignDocumentModal } from '@/components/document/SignDocumentModal';
import { formatDate, getInitials, classNames } from '@/utils/helpers';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import {
  FileText, Edit3, XCircle, Download, CheckCircle, Pen,
  History, Clock, User, Building, Calendar, DownloadCloud, Eye, Trash2, Users,
  AlertTriangle, Shield, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

function CancelRequestBanner({ doc, onApprove, canApprove }) {
  if (!doc.cancellation_request) return null;

  const cr = doc.cancellation_request;

  if (doc.status === 'cancelled') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <XCircle size={20} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-amber-900">Document Cancelled</h3>
            <Badge size="xs" className="bg-amber-100 text-amber-700">Cancelled</Badge>
          </div>
          <p className="text-xs text-amber-700">
            Cancelled by {cr.requested_by} on {formatDate(cr.created_at)}
          </p>
          {cr.reason && <p className="text-xs text-amber-600 mt-1 italic">Reason: {cr.reason}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-amber-900">Cancellation Pending Approval</h3>
          <Badge size="xs" className="bg-amber-100 text-amber-700">Pending</Badge>
        </div>
        <p className="text-xs text-amber-700">
          Requested by {cr.requested_by} on {formatDate(cr.created_at)}
        </p>
        {cr.reason && <p className="text-xs text-amber-600 mt-1 italic">Reason: {cr.reason}</p>}
        <p className="text-xs text-amber-600 mt-2">Awaiting approval from signers who have already signed.</p>
      </div>
      {canApprove && (
        <Button size="sm" variant="danger" className="flex-shrink-0 rounded-xl"
          loading={onApprove.isPending}
          onClick={() => onApprove.mutate()}>
          Approve Cancellation
        </Button>
      )}
    </div>
  );
}

function DeleteRequestBanner({ doc, onApprove, canApprove }) {
  if (!doc.deletion_request) return null;

  const dr = doc.deletion_request;

  if (doc.status === 'deleted') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-red-900">Document Deleted</h3>
            <Badge size="xs" className="bg-red-100 text-red-700">Deleted</Badge>
          </div>
          <p className="text-xs text-red-700">
            Deleted by {dr.requested_by} on {formatDate(dr.created_at)}
          </p>
          {dr.reason && <p className="text-xs text-red-600 mt-1 italic">Reason: {dr.reason}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-red-900">Deletion Pending Approval</h3>
          <Badge size="xs" className="bg-red-100 text-red-700">Pending</Badge>
        </div>
        <p className="text-xs text-red-700">
          Requested by {dr.requested_by} on {formatDate(dr.created_at)}
        </p>
        {dr.reason && <p className="text-xs text-red-600 mt-1 italic">Reason: {dr.reason}</p>}
        <p className="text-xs text-red-600 mt-2">Awaiting approval from all signers.</p>
      </div>
      {canApprove && (
        <Button size="sm" variant="danger" className="flex-shrink-0 rounded-xl"
          loading={onApprove.isPending}
          onClick={() => onApprove.mutate()}>
          Approve Deletion
        </Button>
      )}
    </div>
  );
}

function SigningTurnIndicator({ doc, signers }) {
  if (doc.signing_mode !== 'sequential' || !doc.current_signing_order) return null;

  const currentSigner = signers?.find(s => s.signing_order === doc.current_signing_order);

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
        {doc.current_signing_order}
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-indigo-800">
          <span className="font-bold">{currentSigner?.name || 'Unknown signer'}</span>
          <span className="text-indigo-600"> is next in the signing order</span>
        </p>
        <p className="text-[10px] text-indigo-500 font-medium">
          Turn {doc.current_signing_order} of {signers?.length || 0}
        </p>
      </div>
      <Shield size={14} className="text-indigo-400" />
    </div>
  );
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancelModal, setCancelModal] = useState(false);
  const [deleteFileModal, setDeleteFileModal] = useState(false);
  const [signModal, setSignModal] = useState(false);
  const [signStep, setSignStep] = useState('draw');

  const { data, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentApi.get(id),
  });

  const { data: logData, isLoading: logsLoading } = useQuery({
    queryKey: ['document-logs', id],
    queryFn: () => documentApi.auditLog(id),
  });

  const cancelMut = useMutation({
    mutationFn: () => documentApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Document cancelled.');
      setCancelModal(false);
    },
  });

  const approveCancelMut = useMutation({
    mutationFn: () => documentApi.approveCancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Cancellation approved. Document is now cancelled.');
      setCancelModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to approve cancellation.');
    },
  });

  const approveDeleteMut = useMutation({
    mutationFn: () => documentApi.approveDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Deletion approved. Document is now deleted.');
      setDeleteFileModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to approve deletion.');
    },
  });

  const deleteFileMut = useMutation({
    mutationFn: () => documentApi.deleteOriginalFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Original file deleted.');
      setDeleteFileModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete file.');
    },
  });

  const requestCancelMut = useMutation({
    mutationFn: () => documentApi.requestCancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Cancellation request submitted.');
      setCancelModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to request cancellation.');
    },
  });

  const requestDeleteMut = useMutation({
    mutationFn: () => documentApi.requestDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Deletion request submitted.');
      setDeleteFileModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to request deletion.');
    },
  });

  const signMut = useMutation({
    mutationFn: (signatureData) => documentApi.sign(id, signatureData),
    onSuccess: () => {
      toast.success('OTP sent to your email.');
      setSignStep('otp');
    },
    onError: (err) => {
      const code = err.response?.data?.error?.code;
      const message = err.response?.data?.error?.message || 'Failed to sign document.';
      if (code === 'NOT_YOUR_TURN') {
        toast.error('It is not your turn to sign yet.');
      } else if (code === 'ALREADY_SIGNED') {
        toast.error('You have already signed this document.');
      } else {
        toast.error(message);
      }
    },
  });

  const verifyOtpMut = useMutation({
    mutationFn: (otp) => documentApi.signVerifyOtp(id, otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Document signed successfully!');
      setSignModal(false);
      setSignStep('draw');
    },
    onError: (err) => {
      const code = err.response?.data?.error?.code;
      const message = err.response?.data?.error?.message || 'Failed to verify OTP.';
      if (code === 'INVALID_OTP') {
        toast.error('Invalid or expired OTP code.');
      } else if (code === 'SIGNATURE_EXPIRED') {
        toast.error('Signature data expired. Please sign again.');
        setSignStep('draw');
      } else {
        toast.error(message);
      }
    },
  });

  const doc = data?.data?.document;
  const logs = logData?.data?.logs || logData?.data || [];

  // Compute approval capabilities based on current user's signer status
  const user = getCurrentUser();
  const currentSigner = doc?.signers?.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase());
  const isSignedSigner = currentSigner?.status === 'signed';
  const isAnySigner = !!currentSigner;
  const hasDeclined = currentSigner?.status === 'declined';
  const isCurrentTurn = doc?.signing_mode !== 'sequential' || doc?.current_signing_order === currentSigner?.signing_order;
  const isSignable = doc?.status === 'in_progress' && isAnySigner && !isSignedSigner && !hasDeclined && isCurrentTurn;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Loading document...</p>
    </div>
  );

  if (!doc) return (
    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-200 dark:border-slate-800 my-20 mx-auto max-w-lg shadow-xl shadow-indigo-500/5">
      <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 transition-transform hover:scale-110">
        <FileText size={48} className="text-gray-200 dark:text-slate-700" />
      </div>
      <p className="text-gray-900 dark:text-white font-black text-2xl tracking-tight">Document not found</p>
      <p className="text-gray-500 dark:text-slate-400 text-sm mt-3 font-medium px-8">This document may have been deleted or moved to another workspace.</p>
      <Button variant="subtle" className="mt-10 rounded-2xl px-8" onClick={() => navigate('/dashboard/documents')}>Back to Documents</Button>
    </div>
  );

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Approval Workflow Banners — visible to all roles */}
      <CancelRequestBanner doc={doc} onApprove={approveCancelMut} canApprove={isSignedSigner} />
      <DeleteRequestBanner doc={doc} onApprove={approveDeleteMut} canApprove={isAnySigner} />

      {/* Sequential Turn Indicator — visible to all roles */}
      {doc.signing_mode === 'sequential' && doc.current_signing_order && (
        <SigningTurnIndicator doc={doc} signers={doc.signers} />
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <Badge size="sm" className={classNames('px-4 py-1', STATUS_COLORS[doc.status])}>{STATUS_LABELS[doc.status]}</Badge>
            <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-[0.2em]">Ref: {doc.id}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white truncate tracking-tight mb-4">{doc.title}</h1>
          <p className="text-base text-gray-500 dark:text-slate-400 font-medium max-w-3xl leading-relaxed">
            {doc.description || 'No additional description provided for this document.'}
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          {isSignable && (
            <Button size="lg" className="rounded-2xl shadow-xl shadow-emerald-500/20 px-10 bg-emerald-600 hover:bg-emerald-700 text-white border-none" onClick={() => setSignModal(true)}>
              <Pen size={20} />Sign Now
            </Button>
          )}
          {doc.is_editable && (
            <Link to={`/dashboard/documents/${id}/editor`}>
              <Button size="lg" className="rounded-2xl shadow-xl shadow-indigo-500/20 px-10"><Edit3 size={20} />Editor</Button>
            </Link>
          )}
          {doc.status === 'in_progress' && !doc.cancellation_request && doc.role === 'owner' && (
            <Button variant="danger" size="lg" className="rounded-2xl shadow-xl shadow-red-500/10 px-10" onClick={() => setCancelModal(true)}><XCircle size={20} />Cancel</Button>
          )}
          {doc.status === 'completed' && !doc.deletion_request && doc.role === 'owner' && (
            <Button variant="danger" size="lg" className="rounded-2xl shadow-xl shadow-red-500/10 px-10" onClick={() => setDeleteFileModal(true)}><Trash2 size={20} />Delete</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Signers & Assets */}
        <div className="lg:col-span-8 space-y-10">

          {/* Signers Section */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/20">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-indigo-500" />
                <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Signing Workflow</h2>
              </div>
              <div className="flex items-center gap-3">
                <Badge size="xs" variant="gray" className="font-black px-3">{doc.signing_mode} mode</Badge>
                {doc.signing_mode === 'sequential' && doc.current_signing_order && (
                  <Badge size="xs" variant="indigo" className="font-black px-3">Turn {doc.current_signing_order}</Badge>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {doc.signers?.map(s => (
                <div key={s.id} className={classNames(
                  'px-10 py-8 flex items-center gap-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all group',
                  doc.signing_mode === 'sequential' && doc.current_signing_order === s.signing_order && 'bg-indigo-50/30 dark:bg-indigo-900/10'
                )}>
                  <div className={classNames(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-base flex-shrink-0 shadow-sm transition-transform',
                    doc.signing_mode === 'sequential' && doc.current_signing_order === s.signing_order
                      ? 'bg-indigo-600 text-white group-hover:scale-110'
                      : 'bg-indigo-50 dark:bg-indigo-900/30 group-hover:scale-110'
                  )}>
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-gray-900 dark:text-white truncate tracking-tight">{s.name}</p>
                      {doc.signing_mode === 'sequential' && s.signing_order && (
                        <span className="text-[9px] font-black bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase">
                          #{s.signing_order}
                        </span>
                      )}
                      {doc.signing_mode === 'sequential' && doc.current_signing_order === s.signing_order && (
                        <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase animate-pulse">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-1 font-medium italic">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.signed_at ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="emerald" size="xs" className="px-3">Verified Signed</Badge>
                        <span className="text-[10px] text-gray-300 dark:text-slate-600 font-black uppercase tracking-widest">{formatDate(s.signed_at)}</span>
                      </div>
                    ) : (
                      <Badge variant="gray" size="xs" className="px-3">Waiting Action</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Asset Management Section */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm p-10">
            <div className="flex items-center gap-3 mb-10">
              <DownloadCloud size={18} className="text-indigo-500" />
              <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Document Assets</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original File */}
              <div className="p-8 bg-gray-50/50 dark:bg-slate-800/30 rounded-3xl border border-gray-100 dark:border-slate-800/50 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center border border-gray-100 dark:border-slate-700 text-gray-300 group-hover:text-indigo-500 transition-colors mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Original Draft</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">{doc.file?.size_formatted || 'N/A'}</p>

                {doc.file?.original_url ? (
                  <div className="flex gap-2 w-full mt-auto">
                    <a href={doc.file.original_url} target="_blank" rel="noreferrer" className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full rounded-xl"><Download size={14} />Download</Button>
                    </a>
                    {['draft', 'pending', 'cancelled', 'expired'].includes(doc.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-all px-3"
                        onClick={() => setDeleteFileModal(true)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="w-full py-2 px-4 bg-gray-100 dark:bg-slate-900/50 rounded-xl">
                    <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest">Asset Removed</span>
                  </div>
                )}
              </div>

              {/* Signed File (Conditional) */}
              <div className={classNames(
                'p-8 rounded-3xl border transition-all flex flex-col items-center text-center group',
                doc.status === 'completed' && doc.file?.signed_url
                  ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-800/30 hover:shadow-xl hover:shadow-emerald-500/5'
                  : 'bg-gray-50/20 dark:bg-slate-800/10 border-dashed border-gray-200 dark:border-slate-800 opacity-50'
              )}>
                <div className={classNames(
                  'w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm transition-all',
                  doc.status === 'completed' ? 'bg-white dark:bg-slate-900 text-emerald-500 group-hover:scale-110' : 'bg-gray-100 dark:bg-slate-800 text-gray-300'
                )}>
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Final Version</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">
                  {doc.status === 'completed' ? 'Verified & Sealed' : 'Pending Completion'}
                </p>

                {doc.status === 'completed' && doc.file?.signed_url && (
                  <a href={doc.file.signed_url} target="_blank" rel="noreferrer" className="w-full mt-auto">
                    <Button variant="primary" size="sm" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 border-none"><Download size={14} />Download Final</Button>
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* History Section (Moved here) */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm p-10 flex flex-col min-h-[500px]">
            <div className="flex items-center gap-3 mb-10">
              <History size={16} className="text-indigo-500" />
              <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Activity Log</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-100 dark:scrollbar-thumb-slate-800">
              {logsLoading ? (
                <div className="flex justify-center py-10"><Spinner size="sm" /></div>
              ) : (
                <AuditLog logs={logs} />
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Information */}
        <div className="lg:col-span-4 space-y-10">
          {/* Metadata Card */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm p-10">
            <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Metadata</h2>
            <div className="space-y-6">
              {[
                { label: 'Created On', value: formatDate(doc.created_at), icon: Calendar },
                { label: 'Owner',      value: doc.user?.name,           icon: User },
                { label: 'Company',    value: doc.company?.name || 'Personal', icon: Building, isIndigo: !!doc.company },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.15em]">
                  <div className="flex items-center gap-3 text-gray-300 dark:text-slate-600">
                    <item.icon size={14} className="text-indigo-400/50" /> {item.label}
                  </div>
                  <span className={classNames(item.isIndigo ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-slate-400')}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Sign Document Modal */}
      <SignDocumentModal
        open={signModal}
        onClose={() => { setSignModal(false); setSignStep('draw'); }}
        onSign={signMut.mutate}
        onVerifyOtp={verifyOtpMut.mutate}
        signLoading={signMut.isPending}
        verifyLoading={verifyOtpMut.isPending}
        step={signStep}
        signer={currentSigner}
        documentTitle={doc.title}
      />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={cancelModal} onClose={() => setCancelModal(false)}
        onConfirm={() => {
          if (doc.role === 'owner') {
            if (doc.cancellation_request) {
              approveCancelMut.mutate();
            } else {
              requestCancelMut.mutate();
            }
          } else {
            approveCancelMut.mutate();
          }
        }}
        loading={cancelMut.isPending || requestCancelMut.isPending || approveCancelMut.isPending}
        title={doc.cancellation_request ? "Approve Cancellation?" : "Cancel Signing Request?"}
        message={
          doc.cancellation_request
            ? "Your approval will help finalize the cancellation. All signing links will be invalidated."
            : "This will invalidate all current signing links and prevent further actions on this document. This cannot be undone."
        }
        confirmLabel={doc.cancellation_request ? "Approve Cancellation" : "Continue"}
      />

      <ConfirmDialog
        open={deleteFileModal} onClose={() => setDeleteFileModal(false)}
        onConfirm={() => {
          if (doc.role === 'owner') {
            if (doc.deletion_request) {
              approveDeleteMut.mutate();
            } else if (doc.status === 'completed') {
              requestDeleteMut.mutate();
            } else {
              deleteFileMut.mutate();
            }
          } else {
            approveDeleteMut.mutate();
          }
        }}
        loading={deleteFileMut.isPending || requestDeleteMut.isPending || approveDeleteMut.isPending}
        title={doc.deletion_request ? "Approve Deletion?" : doc.status === 'completed' ? "Delete Completed Document?" : "Delete Original File?"}
        message={
          doc.deletion_request
            ? "Your approval will permanently delete this document and all associated data."
            : doc.status === 'completed'
            ? "This will create a deletion request requiring all signers' approval before the document is permanently deleted."
            : "The original file will be permanently removed. The signed PDF (if any) will be preserved."
        }
        confirmLabel={doc.deletion_request ? "Approve Deletion" : "Continue"}
      />
    </div>
  );
}