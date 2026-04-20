import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentApi } from "@/api/document.api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  SIGNER_STATUS_COLORS,
} from "@/utils/constants";
import { formatDateTime, getInitials } from "@/utils/helpers";
import {
  ArrowLeft,
  Edit3,
  XCircle,
  FileText,
  Clock,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { SignerList } from "@/components/document/SignerList";
import { AuditLogTimeline } from "@/components/document/AuditLog";

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: () => documentApi.get(id),
    refetchInterval: 30000, // auto-refresh every 30s for live status
  });

  const { data: auditData } = useQuery({
    queryKey: ["audit-log", id],
    queryFn: () => documentApi.auditLog(id),
  });

  const cancelMut = useMutation({
    mutationFn: () => documentApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      toast.success("Document cancelled.");
      setCancelConfirm(false);
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" />
      </div>
    );

  const doc = data?.data?.document;
  console.log("DOC:", doc);
console.log("STATUS:", doc?.status);
console.log("SIGNED URL:", doc?.file?.signed_url);

if (!doc)
  return (
    <div className="flex justify-center items-center h-full">
      <p className="text-gray-500">Not found.</p>
    </div>
  );

  const logs = auditData?.data?.logs || [];

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
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {doc.title}
          </h1>
          {doc.description && (
            <p className="text-sm text-gray-500">{doc.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={STATUS_COLORS[doc.status]}>
            {STATUS_LABELS[doc.status]}
          </Badge>
          {doc.is_editable && (
            <Link to={`/dashboard/documents/${id}/editor`}>
              <Button size="sm" variant="secondary">
                <Edit3 size={14} />
                Edit
              </Button>
            </Link>
          )}
          {/* {['draft', 'pending'].includes(doc.status) && (
            <Link to={`/dashboard/documents/${id}/editor`}>
              <Button size="sm" variant="secondary"><Edit3 size={14} />Edit</Button>
            </Link>
          )} */}
          {["pending", "in_progress"].includes(doc.status) && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setCancelConfirm(true)}
            >
              <XCircle size={14} />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Document Preview
              </span>
              <span className="ml-auto text-xs text-gray-400">
                {doc.file?.size_formatted}
              </span>
            </div>

            {/* ── CHANGE 2: prefer signed_url ── */}
            <iframe
              src={`${doc.file?.signed_url ?? doc.file?.original_url}#toolbar=0&navpanes=0`}
              className="w-full h-96 border-none"
              title="Document"
            />
            


            {/* ── CHANGE 3: download button ── */}
            {doc.status === "completed" && doc.file?.signed_url && (
              <div className="px-5 py-3 border-t border-gray-100 bg-green-50 flex items-center justify-between">
                <p className="text-sm text-green-700 font-medium">
                  All parties have signed — document is finalised.
                </p>
                <a
                  href={doc.file.signed_url}
                  download={`${doc.title}-signed.pdf`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <Download size={15} />
                  Download Signed PDF
                </a>
              </div>
            )}
          </div>

          {/* Audit Log */}
          {logs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">
                  Activity Log
                </h3>
              </div>
              <AuditLogTimeline logs={logs} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Details</h3>
            <div className="space-y-2 text-sm">
              {[
                [
                  "Mode",
                  <span className="capitalize">{doc.signing_mode}</span>,
                ],
                [
                  "Progress",
                  `${doc.counts?.signed_count ?? 0} / ${doc.counts?.total_signers ?? 0} signed`,
                ],
                ["Sent", doc.sent_at ? formatDateTime(doc.sent_at) : "—"],
                [
                  "Completed",
                  doc.completed_at ? formatDateTime(doc.completed_at) : "—",
                ],
                [
                  "Expires",
                  doc.expires_at ? formatDateTime(doc.expires_at) : "No expiry",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-900 font-medium text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            {doc.counts?.total_signers > 0 && (
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
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Company
              </h3>
              <p className="text-sm text-gray-900">{doc.company.name}</p>
            </div>
          )}
        </div>
      </div>

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
