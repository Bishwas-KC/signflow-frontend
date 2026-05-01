import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import { Button }      from '@/components/ui/Button';
import { Badge }       from '@/components/ui/Badge';
import { Spinner }     from '@/components/ui/Spinner';
import { ConfirmDialog }    from '@/components/shared/ConfirmDialog';
import { SignerList }       from '@/components/document/SignerList';
import { AuditLogTimeline } from '@/components/document/AuditLog';
import { STATUS_COLORS, STATUS_LABELS, SIGNER_STATUS_COLORS } from '@/utils/constants';
import { formatDateTime } from '@/utils/helpers';
import {
  ArrowLeft, Edit3, XCircle, FileText,
  Download, Trash2, ShieldCheck, AlertTriangle, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── File viewer tabs component ────────────────────────────────────────────────
function DocumentViewer({ doc }) {
  const [activeTab, setActiveTab] = useState(
    // Default to signed tab if original is deleted or doc is completed
    doc.file?.original_deleted || doc.status === 'completed' ? 'signed' : 'original'
  );

  const hasOriginal = !doc.file?.original_deleted && (doc.file?.pdf_url || doc.file?.original_url);
  const hasSigned   = !!doc.file?.signed_url;

  const viewUrl = activeTab === 'signed'
    ? doc.file?.signed_url
    : (doc.file?.pdf_url ?? doc.file?.original_url);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-100">
        {/* Original tab */}
        {hasOriginal && (
          <button
            onClick={() => setActiveTab('original')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'original'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={14} />
            Original file
          </button>
        )}

        {/* Signed tab */}
        {hasSigned && (
          <button
            onClick={() => setActiveTab('signed')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'signed'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheck size={14} />
            Signed document
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
              Final
            </span>
          </button>
        )}

        {/* File size badge */}
        <span className="ml-auto px-4 text-xs text-gray-400">
          {doc.file?.size_formatted}
        </span>
      </div>

      {/* Original deleted notice */}
      {doc.file?.original_deleted && !hasSigned && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
          <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Original file was deleted on {formatDateTime(doc.file?.original_deleted_at)}.
          </p>
        </div>
      )}

      {/* If original deleted and showing signed */}
      {doc.file?.original_deleted && hasSigned && activeTab === 'signed' && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 border-b border-gray-100">
          <ShieldCheck size={12} className="text-green-500 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            Only the signed version is available — original was permanently deleted.
          </p>
        </div>
      )}

      {/* PDF iframe */}
      {viewUrl ? (
        <iframe
          src={`${viewUrl}#toolbar=0&navpanes=0`}
          className="w-full border-none"
          style={{ height: 680 }}
          title={activeTab === 'signed' ? 'Signed Document' : 'Original Document'}
          key={viewUrl} // re-mount when tab changes
        />
      ) : (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="text-center space-y-2">
            <Eye size={32} className="mx-auto opacity-30" />
            <p className="text-sm">No preview available</p>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-400">
          {activeTab === 'signed' ? 'Final signed document' : 'Original uploaded file'}
        </p>
        <div className="flex items-center gap-2">
          {/* Download button */}
          {viewUrl && (
            <a
              href={viewUrl}
              download={
                activeTab === 'signed'
                  ? `${doc.title}-signed.pdf`
                  : doc.title
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: activeTab === 'signed' ? '#16a34a' : '#4f46e5',
                color: 'white',
              }}
            >
              <Download size={12} />
              Download {activeTab === 'signed' ? 'signed' : 'original'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete original file confirmation ─────────────────────────────────────────
function DeleteOriginalButton({ doc, onDeleted }) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);

  const deleteMut = useMutation({
    mutationFn: () => documentApi.deleteOriginalFile(doc.id),
    onSuccess: (res) => {
      queryClient.setQueryData(['document', String(doc.id)], res);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Original file permanently deleted.');
      setConfirm(false);
      onDeleted?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete original file.');
    },
  });

  if (!doc.file?.can_delete_original) return null;

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
      >
        <Trash2 size={12} />
        Delete original file
      </button>

      {/* Custom confirm dialog with warning */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            {/* Icon */}
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>

            <h3 className="text-base font-semibold text-gray-900 text-center mb-2">
              Permanently delete original file?
            </h3>

            {/* Warning box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1.5">
                  <p className="font-medium">This action cannot be undone.</p>
                  <ul className="list-disc pl-3 space-y-1">
                    <li>The original unsigned file will be <strong>permanently deleted</strong> from our servers.</li>
                    <li>The <strong>signed document</strong> will remain available for download.</li>
                    <li>You will not be able to recover the original after deletion.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Signed file confirmation */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl mb-5">
              <ShieldCheck size={15} className="text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-800">
                The <strong>signed PDF</strong> with all signatures is safely stored and will remain accessible.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirm(false)}
                disabled={deleteMut.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate()}
              >
                <Trash2 size={14} /> Yes, delete permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn:  () => documentApi.get(id),
    refetchInterval: 30_000,
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit-log', id],
    queryFn:  () => documentApi.auditLog(id),
  });

  const cancelMut = useMutation({
    mutationFn: () => documentApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Document cancelled.');
      setCancelConfirm(false);
    },
  });

  if (isLoading) return (
    <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>
  );

  const doc  = data?.data?.document;
  const logs = auditData?.data?.logs || [];

  if (!doc) return (
    <div className="flex justify-center items-center h-full">
      <p className="text-gray-500">Document not found.</p>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{doc.title}</h1>
          {doc.description && (
            <p className="text-sm text-gray-500 mt-0.5">{doc.description}</p>
          )}
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={STATUS_COLORS[doc.status]}>{STATUS_LABELS[doc.status]}</Badge>

          {doc.is_editable && (
            <Link to={`/dashboard/documents/${id}/editor`}>
              <Button size="sm" variant="secondary">
                <Edit3 size={14} /> Edit
              </Button>
            </Link>
          )}

          {['pending', 'in_progress'].includes(doc.status) && (
            <Button size="sm" variant="danger" onClick={() => setCancelConfirm(true)}>
              <XCircle size={14} /> Cancel
            </Button>
          )}

          {/* Delete original — only when completed + signed exists */}
          <DeleteOriginalButton
            doc={doc}
            onDeleted={() => queryClient.invalidateQueries({ queryKey: ['document', id] })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* ── Document viewer with tabs ── */}
          <DocumentViewer doc={doc} />

          {/* Audit log */}
          {logs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Activity Log</h3>
              </div>
              <AuditLogTimeline logs={logs} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Details</h3>
            <div className="space-y-2.5 text-sm">
              {[
                ['Mode',      <span className="capitalize">{doc.signing_mode}</span>],
                ['Progress',  `${doc.counts?.signed_count ?? 0} / ${doc.counts?.total_signers ?? 0} signed`],
                ['Sent',      doc.sent_at      ? formatDateTime(doc.sent_at)      : '—'],
                ['Completed', doc.completed_at ? formatDateTime(doc.completed_at) : '—'],
                ['Expires',   doc.expires_at   ? formatDateTime(doc.expires_at)   : 'No expiry'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-900 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {(doc.counts?.total_signers ?? 0) > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Completion</span>
                  <span>{doc.progress ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${doc.progress ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* File storage status */}
            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              <p className="text-xs font-medium text-gray-500">File storage</p>
              <div className="flex items-center gap-2 text-xs">
                {doc.file?.original_deleted ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                    <span className="text-gray-400">Original deleted</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-gray-600">Original file stored</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                {doc.file?.signed_url ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Signed PDF ready</span>
                  </>
                ) : doc.status === 'completed' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0 animate-pulse" />
                    <span className="text-gray-500">Generating signed PDF…</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
                    <span className="text-gray-400">Signed PDF not yet created</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Signers */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Signers</h3>
            </div>
            <SignerList
              signers={doc.signers || []}
              signingMode={doc.signing_mode}
            />
          </div>

          {/* Company */}
          {doc.company && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Company</h3>
              <p className="text-sm text-gray-900">{doc.company.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel confirm */}
      <ConfirmDialog
        open={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        onConfirm={() => cancelMut.mutate()}
        loading={cancelMut.isPending}
        title="Cancel document?"
        message="This will cancel the signing process. All signers will no longer be able to sign."
        confirmLabel="Yes, Cancel"
      />
    </div>
  );
}