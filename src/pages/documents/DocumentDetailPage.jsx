import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { AuditLogTimeline } from '@/components/document/AuditLog';
import { DocumentHeader } from '@/components/document/DocumentHeader';
import { DocumentPreview } from '@/components/document/DocumentPreview';
import { ActionRequiredBanner } from '@/components/document/ActionRequiredBanner';
import { SigningProgressCard } from '@/components/document/SigningProgressCard';
import {
  FileText, AlertTriangle, XCircle, History,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Cancel Request Banner ───────────────────────────────────────────────

function CancelRequestBanner({ doc, onApprove, canApprove }) {
  if (!doc.cancellation_request) return null;
  const cr = doc.cancellation_request;

  if (doc.status === 'cancelled') {
    return (
      <div className="bg-amber-50 border border-amber-200/70 rounded-xl px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <XCircle size={20} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">Document Cancelled</p>
          <p className="text-xs text-amber-700 mt-0.5">
            {cr.created_at ? new Date(cr.created_at).toLocaleDateString() : ''}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200/70 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900">Cancellation Pending Approval</p>
        <p className="text-xs text-amber-700 mt-0.5">
          {cr.created_at ? new Date(cr.created_at).toLocaleDateString() : ''}
        </p>
        <p className="text-xs text-amber-600 mt-1">Awaiting approval from signers who have already signed.</p>
      </div>
      {canApprove && (
        <Button size="sm" variant="danger" className="rounded-lg w-full sm:w-auto"
          loading={onApprove.isPending}
          onClick={() => onApprove.mutate()}>
          Approve Cancellation
        </Button>
      )}
    </div>
  );
}

// ── Delete Request Banner ────────────────────────────────────────────────

function DeleteRequestBanner({ doc, onApprove, onReject, onCancelDelete, canApprove, canReject, isInitiator }) {
  const dr = doc.deletion_request;
  if (!dr) return null;

  return (
    <div className="bg-red-50 border border-red-200/70 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-red-900">Deletion Pending Approval</p>
        <p className="text-xs text-red-700 mt-0.5">
          {dr.created_at ? new Date(dr.created_at).toLocaleDateString() : ''}
        </p>
        <p className="text-xs text-red-600 mt-1">Awaiting approval from all signed signers.</p>
      </div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        {isInitiator && (
          <Button size="sm" variant="secondary" className="rounded-lg flex-1 sm:flex-none"
            loading={onCancelDelete.isPending}
            onClick={() => onCancelDelete.mutate()}>
            Withdraw
          </Button>
        )}
        {canApprove && (
          <Button size="sm" variant="danger" className="rounded-lg flex-1 sm:flex-none"
            loading={onApprove.isPending}
            onClick={() => onApprove.mutate()}>
            Approve
          </Button>
        )}
        {canReject && (
          <Button size="sm" variant="secondary" className="rounded-lg flex-1 sm:flex-none"
            loading={onReject.isPending}
            onClick={() => onReject.mutate()}>
            Reject
          </Button>
        )}
      </div>
    </div>
  );
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancelModal, setCancelModal] = useState(false);
  const [deleteFileModal, setDeleteFileModal] = useState(false);

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
      toast.success('Cancellation approved.');
      setCancelModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to approve cancellation.');
    },
  });

  const approveDeleteMut = useMutation({
    mutationFn: () => documentApi.approveDelete(id),
    onSuccess: (res) => {
      if (res?.data?.deleted) {
        toast.success('Document deleted successfully.');
        navigate('/dashboard/documents', { replace: true });
      } else {
        queryClient.invalidateQueries({ queryKey: ['document', id] });
        toast.success('Deletion approved.');
      }
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

  const deleteMut = useMutation({
    mutationFn: () => documentApi.delete(id),
    onSuccess: () => {
      toast.success('Document deleted successfully.');
      navigate('/dashboard/documents', { replace: true });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete document.');
    },
  });

  const requestCancelMut = useMutation({
    mutationFn: () => documentApi.requestCancel(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success(res?.data?.request_id ? 'Cancellation request submitted.' : 'Document cancelled.');
      setCancelModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to request cancellation.');
    },
  });

  const requestDeleteMut = useMutation({
    mutationFn: () => documentApi.requestDelete(id),
    onSuccess: (res) => {
      if (!res?.data?.request_id) {
        toast.success('Document deleted successfully.');
        navigate('/dashboard/documents', { replace: true });
      } else {
        queryClient.invalidateQueries({ queryKey: ['document', id] });
        toast.success('Deletion request submitted.');
        setDeleteFileModal(false);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to request deletion.');
    },
  });

  const rejectDeleteMut = useMutation({
    mutationFn: () => documentApi.rejectDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Deletion request rejected.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to reject deletion.');
    },
  });

  const cancelDeleteMut = useMutation({
    mutationFn: () => documentApi.cancelDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Deletion request withdrawn.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel deletion request.');
    },
  });

  const doc = data?.data?.document;
  const logs = logData?.data?.logs || logData?.data || [];

  const user = getCurrentUser();
  const currentSigner = doc?.signers?.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase());
  const isSignedSigner = currentSigner?.status === 'signed';
  const isAnySigner = !!currentSigner;
  const hasDeclined = currentSigner?.status === 'declined';
  const isCurrentTurn = doc?.signing_mode !== 'sequential' || doc?.current_signing_order === currentSigner?.signing_order;
  const isSignable = doc?.status === 'in_progress' && isAnySigner && !isSignedSigner && !hasDeclined && isCurrentTurn;

  const dr = doc?.deletion_request;
  const isInitiator = dr?.requested_by_id === user?.id;
  const canApproveDelete = dr && !isInitiator && (doc.role === 'owner' || isSignedSigner);
  const canRejectDelete = canApproveDelete;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading document...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 my-20 mx-auto max-w-lg">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText size={40} className="text-gray-200" />
        </div>
        <p className="text-gray-900 font-bold text-xl tracking-tight">Document not found</p>
        <p className="text-gray-500 text-sm mt-2">This document may have been deleted or moved.</p>
        <Button variant="subtle" className="mt-8 rounded-xl" onClick={() => navigate('/dashboard/documents')}>
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 pt-3 pb-4 lg:pb-6 max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Status banners */}
      {doc.status !== 'cancelled' && (
        <>
          <CancelRequestBanner doc={doc} onApprove={approveCancelMut} canApprove={isSignedSigner} />
          <DeleteRequestBanner doc={doc} onApprove={approveDeleteMut} onReject={rejectDeleteMut}
            onCancelDelete={cancelDeleteMut} isInitiator={isInitiator}
            canApprove={canApproveDelete} canReject={canRejectDelete} />
        </>
      )}

      {/* Header */}
      <DocumentHeader
        doc={doc}
        onCancel={() => setCancelModal(true)}
        onDelete={() => setDeleteFileModal(true)}
      />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <DocumentPreview doc={doc} />
        </div>
        <div className="xl:col-span-4 space-y-5">
          <ActionRequiredBanner
            doc={doc}
            signers={doc.signers}
            currentSigner={currentSigner}
            isSignable={isSignable}
            onSign={() => navigate(`/sign/${doc.my_signing_token}/sign`)}
          />
          <SigningProgressCard doc={doc} signers={doc.signers} />
          <section className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <History size={16} className="text-indigo-500" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Activity Timeline</h2>
            </div>
            {logsLoading ? (
              <div className="flex justify-center py-10"><Spinner size="sm" /></div>
            ) : (
              <AuditLogTimeline logs={logs} />
            )}
          </section>
        </div>
      </div>

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
            : doc.role === 'owner' && isSignedSigner
              ? "The document will be cancelled immediately since you are also a signed signer. All signing links will be invalidated."
              : "This will create a cancellation request requiring approval from all signed signers. All signing links will be invalidated."
        }
        confirmLabel={doc.cancellation_request ? "Approve Cancellation" : "Continue"}
      />

      <ConfirmDialog
        open={deleteFileModal} onClose={() => setDeleteFileModal(false)}
        onConfirm={() => {
          if (doc.deletion_request) {
            approveDeleteMut.mutate();
          } else if (['draft', 'pending', 'cancelled'].includes(doc.status)) {
            deleteMut.mutate();
          } else {
            requestDeleteMut.mutate();
          }
        }}
        loading={deleteMut.isPending || requestDeleteMut.isPending || approveDeleteMut.isPending}
        title={doc.deletion_request ? "Approve Deletion?" : "Delete Document?"}
        message={
          doc.deletion_request
            ? "Your approval will permanently delete this document and all associated data."
            : ['draft', 'pending', 'cancelled'].includes(doc.status)
              ? "This document will be permanently deleted immediately."
              : "This will create a deletion request requiring approval from all signed signers before the document is permanently deleted."
        }
        confirmLabel={doc.deletion_request ? "Approve Deletion" : "Continue"}
      />
    </div>
  );
}
