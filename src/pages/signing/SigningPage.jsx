import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import SignatureCanvas from "react-signature-canvas";
import { signingApi } from "@/api/signing.api";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { SIGN_ROLES } from "@/utils/constants";
import { formatDateTime } from "@/utils/helpers";
import {
  CheckCircle,
  XCircle,
  Pen,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// ── States ─────────────────────────────────────────────────────────────────────
const STATE = {
  LOADING: "loading",
  READY: "ready",
  SIGNED: "signed",
  DECLINED: "declined",
  ERROR: "error",
};

function ErrorScreen({
  title,
  message,
  icon: Icon = AlertCircle,
  color = "text-red-500",
  bgColor = "bg-red-100",
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
        <div
          className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <Icon size={28} className={color} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

function SuccessScreen({ signer, action }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {action === "declined" ? "Declined" : "Successfully Signed!"}
        </h2>
        <p className="text-gray-500 text-sm">
          {action === "declined"
            ? "You have declined to sign this document. The document owner has been notified."
            : `Thank you, ${signer?.name}. Your signature has been recorded and the document owner has been notified.`}
        </p>
        <p className="text-xs text-gray-400 mt-4">
          You can safely close this window.
        </p>
      </div>
    </div>
  );
}

export default function SigningPage() {
  const { token } = useParams();
  const sigPadRef = useRef(null);
  const [state, setState] = useState(STATE.LOADING);
  const [signingData, setSigningData] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [declineMode, setDeclineMode] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [action, setAction] = useState(null);

  // REPLACE with this (v5 compatible):
  const {
    data: tokenData,
    isError,
    error,
    isSuccess,
  } = useQuery({
    queryKey: ["signing", token],
    queryFn: () => signingApi.getByToken(token),
    retry: false,
  });

  useEffect(() => {
    if (isSuccess && tokenData) {
      setSigningData(tokenData.data);
      setState(STATE.READY);
    }
  }, [isSuccess, tokenData]);

  useEffect(() => {
    if (isError) setState(STATE.ERROR);
  }, [isError]);

  const submitMut = useMutation({
    mutationFn: (data) => signingApi.submit(token, data),
    onSuccess: (res) => {
      setState(STATE.SIGNED);
      setAction("signed");
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      if (errData?.field_errors) {
        toast.error(
          errData.field_errors[0] || "Please complete all required fields.",
        );
      } else {
        toast.error(errData?.message || "Submission failed.");
      }
    },
  });

  const approveMut = useMutation({
    mutationFn: () => signingApi.approve(token),
    onSuccess: () => {
      setState(STATE.SIGNED);
      setAction("approved");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || "Failed to approve."),
  });

  const declineMut = useMutation({
    mutationFn: () => signingApi.decline(token, declineReason),
    onSuccess: () => {
      setState(STATE.SIGNED);
      setAction("declined");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || "Failed to decline."),
  });

  const handleSubmit = () => {
    console.log(sigPadRef);
    
  if (!sigPadRef.current) {
    toast.error("Signature pad not loaded.");
    return;
  }

  if (sigPadRef.current.isEmpty()) {
    toast.error("Please draw your signature first.");
    return;
  }

  const signatureData = sigPadRef.current.toDataURL("image/png");

  submitMut.mutate({
    signature_data: signatureData,
    field_values: fieldValues,
  });
};
  // ── Loading ──────────────────────────────────────────────────────────────────
  if (state === STATE.LOADING) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error states ──────────────────────────────────────────────────────────────
  if (state === STATE.ERROR) {
    const code = error?.response?.data?.error?.code;
    if (code === "DOCUMENT_EXPIRED")
      return (
        <ErrorScreen
          title="Document Expired"
          message="This document has expired and can no longer be signed."
        />
      );
    if (code === "ALREADY_SIGNED")
      return (
        <ErrorScreen
          title="Already Signed"
          message="You have already signed this document."
          icon={CheckCircle}
          color="text-green-500"
          bgColor="bg-green-100"
        />
      );
    if (code === "NOT_YOUR_TURN")
      return (
        <ErrorScreen
          title="Not Your Turn Yet"
          message="The previous signer hasn't completed yet. You'll receive an email when it's your turn."
          icon={AlertCircle}
          color="text-yellow-500"
          bgColor="bg-yellow-100"
        />
      );
    return (
      <ErrorScreen
        title="Invalid Link"
        message="This signing link is invalid or has expired. Please contact the document sender."
      />
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  if (state === STATE.SIGNED) {
    return <SuccessScreen signer={signingData?.signer} action={action} />;
  }

  const { signer, document: doc, fields } = signingData;
  const roleInfo = SIGN_ROLES.find((r) => r.value === signer.sign_role);
  const textFields = fields.filter((f) => f.field_type === "input_text");
  const requiresSignature = fields.some((f) =>
    ["signature", "initial"].includes(f.field_type),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-xs">
                {doc.title}
              </p>
              {doc.company && (
                <p className="text-xs text-gray-500">{doc.company.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={roleInfo?.color || ""}>{roleInfo?.label}</Badge>
            {doc.expires_at && (
              <span className="text-xs text-gray-400 hidden sm:block">
                Expires {formatDateTime(doc.expires_at)}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">
              Document Preview
            </div>
            <iframe
              src={`${doc.file_url}#toolbar=0`}
              className="w-full border-none"
              style={{ height: 700 }}
              title="Document"
            />
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          {/* Signer info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              You are signing as
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold">
                {signer.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{signer.name}</p>
                <p className="text-xs text-gray-500">{signer.email}</p>
              </div>
            </div>
          </div>

          {/* Text fields */}
          {textFields.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Fill Required Fields
              </h3>
              {textFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">
                    {field.label || field.type_label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      field.placeholder || `Enter ${field.type_label}...`
                    }
                    value={fieldValues[field.id] || ""}
                    onChange={(e) =>
                      setFieldValues((prev) => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Signature pad — only for signers/approvers */}
          {signer.sign_role !== "cc" && requiresSignature && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Draw Your Signature
                </h3>
                <button
                  onClick={() => sigPadRef.current?.clear()}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Clear
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                <SignatureCanvas
                  ref={sigPadRef}
                  penColor="#1e1e1e"
                  canvasProps={{ width: 300, height: 140, className: "w-full" }}
                  backgroundColor="rgba(249,250,251,1)"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Sign above using mouse or finger
              </p>
            </div>
          )}

          {/* Approver action */}
          {signer.sign_role === "approver" && !requiresSignature && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-600 mb-4">
                Please review the document carefully and approve or decline.
              </p>
              <Button
                className="w-full mb-2"
                onClick={() => approveMut.mutate()}
                loading={approveMut.isPending}
              >
                <CheckCircle size={15} /> Approve Document
              </Button>
            </div>
          )}

          {/* Submit / Decline */}
          {!declineMode ? (
            <div className="space-y-2">
              {signer.sign_role !== "cc" && (
                <>
                  {signer.sign_role === "signer" || requiresSignature ? (
                    <Button
                      className="w-full"
                      onClick={handleSubmit}
                      loading={submitMut.isPending}
                    >
                      <Pen size={15} /> Submit Signature
                    </Button>
                  ) : null}
                  <button
                    onClick={() => setDeclineMode(true)}
                    className="w-full text-sm text-red-500 hover:text-red-700 py-2 flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle size={14} /> Decline to Sign
                  </button>
                </>
              )}
              {signer.sign_role === "cc" && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">
                    You are a CC recipient. No action is required.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-red-700">
                Reason for declining
              </h3>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please explain why you are declining..."
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setDeclineMode(false);
                    setDeclineReason("");
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  disabled={declineReason.trim().length < 5}
                  loading={declineMut.isPending}
                  onClick={() => declineMut.mutate()}
                >
                  Decline
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
