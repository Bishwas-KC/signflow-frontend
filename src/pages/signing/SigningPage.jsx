import { useEffect, useRef, useState } from 'react';
import { useParams }            from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import SignatureCanvas           from 'react-signature-canvas';
import { signingApi }           from '@/api/signing.api';
import { Button }               from '@/components/ui/Button';
import { Spinner }              from '@/components/ui/Spinner';
import { Badge }                from '@/components/ui/Badge';
import { formatDateTime, getInitials }       from '@/utils/helpers';
import {
  CheckCircle, XCircle, RotateCcw, PenLine,
  AlertCircle, Upload, Clock, X, FileText,
  Shield, Info, Check, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';


// ── Constants ─────────────────────────────────────────────────────────────────
const STATE = {
  LOADING: 'loading', READY: 'ready',
  SIGNED:  'signed',  DECLINED: 'declined', ERROR: 'error',
};

// ── Error screen ──────────────────────────────────────────────────────────────
function ErrorScreen({ title, message, icon: Icon = AlertCircle, iconClass = 'text-red-500', bgClass = 'bg-red-100' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 max-w-md w-full text-center">
        <div className={`w-20 h-20 ${bgClass} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon size={32} className={iconClass} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">{title}</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

// ── Expiry countdown ──────────────────────────────────────────────────────────
function ExpiryBadge({ expiresAt }) {
  if (!expiresAt) return null;
  const expires = new Date(expiresAt);
  const now     = new Date();
  const diffMs  = expires - now;
  const diffH   = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD   = Math.floor(diffH / 24);

  const isExpiringSoon = diffH < 24 && diffH >= 0;
  const isExpired      = diffMs <= 0;

  if (isExpired) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
      isExpiringSoon
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-gray-100 text-gray-600'
    }`}>
      <Clock size={14} />
      {isExpiringSoon
        ? `Expires in ${diffH}h ${Math.floor((diffMs % (1000*60*60)) / (1000*60))}m`
        : diffD > 0
          ? `Expires ${diffD}d ${diffH % 24}h`
          : `Expires ${formatDateTime(expiresAt)}`
      }
    </div>
  );
}

// ── Signature input (draw or upload) ──────────────────────────────────────────
function SignatureInput({ method, setMethod, sigPadRef, uploadFile, setUploadFile, uploadPreview, setUploadPreview }) {

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Only PNG or JPG images are accepted.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB.');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target.result);
    reader.readAsDataURL(file);
    toast.success('Signature uploaded successfully');
  };

  const clearUpload = () => {
    setUploadFile(null);
    setUploadPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Method switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setMethod('draw')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
            method === 'draw'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <PenLine size={16} />
          Draw
        </button>
        <button
          onClick={() => setMethod('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
            method === 'upload'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload size={16} />
          Upload
        </button>
      </div>

      {/* Draw mode */}
      {method === 'draw' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Draw your signature
            </label>
            <button
              onClick={() => sigPadRef.current?.clear()}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} /> Clear
            </button>
          </div>
          <div className="rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors bg-gray-50">
            <SignatureCanvas
              ref={sigPadRef}
              penColor="#4f46e5"
              canvasProps={{
                className: 'w-full',
                style: { display: 'block', width: '100%', height: 180 },
              }}
              backgroundColor="transparent"
            />
          </div>
          <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
            <PenLine size={12} />
            Use mouse, finger, or stylus to sign
          </p>
        </div>
      )}

      {/* Upload mode */}
      {method === 'upload' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Upload signature image
          </label>

          {!uploadPreview ? (
            <label
              className="flex flex-col items-center justify-center gap-3 rounded-lg cursor-pointer border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50/30 transition-all py-12"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Upload size={20} className="text-indigo-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Click to upload signature</p>
                <p className="text-xs text-gray-500 mt-1">PNG or JPG, max 2MB</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="relative rounded-lg border-2 border-indigo-200 bg-gray-50 overflow-hidden">
              <img
                src={uploadPreview}
                alt="Signature preview"
                className="w-full h-40 object-contain p-4"
              />
              <button
                onClick={clearUpload}
                className="absolute top-2 right-2 w-8 h-8 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Check size={12} /> Ready to use
                </span>
              </div>
            </div>
          )}

          {/* Requirements */}
          <div className="rounded-lg px-4 py-3 bg-blue-50 border border-blue-100">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-800">Requirements</p>
                <ul className="text-xs text-blue-700 space-y-0.5 list-disc pl-4">
                  <li>PNG or JPG format, max 2MB</li>
                  <li>White or transparent background works best</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ signerName, documentTitle, pagesSignedOn, signaturePreview }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden">
        <div className="px-10 py-10 text-center bg-gradient-to-br from-emerald-500 to-emerald-600">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <CheckCircle size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Document Signed</h2>
          <p className="text-emerald-100 text-sm mt-2">Thank you, {signerName}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">You have successfully signed</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">"{documentTitle}"</p>
          </div>

          {pagesSignedOn?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Pages signed
              </p>
              <div className="flex flex-wrap gap-2">
                {pagesSignedOn.map(p => (
                  <div key={p}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
                    <Check size={12} />
                    Page {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {signaturePreview && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Your signature
              </p>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                <img src={signaturePreview} alt="Your signature"
                  className="max-h-16 object-contain" />
              </div>
            </div>
          )}

          <div className="rounded-lg px-4 py-3 bg-indigo-50 border border-indigo-100">
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-indigo-800 mb-1">What happens next?</p>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Your signature has been securely applied to the document. The owner has been notified and will receive the completed document.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <CheckCircle size={14} className="text-emerald-500" />
            You can safely close this window
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main signing page ─────────────────────────────────────────────────────────
export default function SigningPage() {
  const { token }  = useParams();
  const sigPadRef  = useRef(null);

  const [state, setState]                   = useState(STATE.LOADING);
  const [signingData, setSigningData]       = useState(null);
  const [method, setMethod]                 = useState('draw');
  const [uploadFile, setUploadFile]         = useState(null);
  const [uploadPreview, setUploadPreview]   = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [declineMode, setDeclineMode]       = useState(false);
  const [declineReason, setDeclineReason]   = useState('');

  const { isError, error, isSuccess, data: tokenData } = useQuery({
    queryKey: ['signing', token],
    queryFn:  () => signingApi.getByToken(token),
    retry:    false,
    refetchOnWindowFocus: false,
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
    mutationFn: (formData) => signingApi.submit(token, formData),
    onSuccess:  () => setState(STATE.SIGNED),
    onError:    (err) => {
      const errData = err.response?.data?.error;
      if (errData?.errors) {
        const msgs = Object.values(errData.errors).flat();
        msgs.forEach(m => toast.error(m));
      } else {
        toast.error(errData?.message || 'Submission failed.');
      }
    },
  });

  const declineMut = useMutation({
    mutationFn: () => signingApi.decline(token, declineReason),
    onSuccess:  () => setState(STATE.DECLINED),
    onError:    (err) => toast.error(err.response?.data?.error?.message || 'Failed.'),
  });

  const handleSubmit = () => {
    if (method === 'draw') {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        toast.error('Please draw your signature before submitting.');
        return;
      }
      const dataUri = sigPadRef.current.toDataURL('image/png');
      setSignaturePreview(dataUri);

      const form = new FormData();
      form.append('method', 'draw');
      form.append('signature_data', dataUri);
      submitMut.mutate(form);

    } else {
      if (!uploadFile) {
        toast.error('Please upload a signature image first.');
        return;
      }
      setSignaturePreview(uploadPreview);

      const form = new FormData();
      form.append('method', 'upload');
      form.append('signature_file', uploadFile);
      submitMut.mutate(form);
    }
  };

  if (state === STATE.LOADING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center gap-6">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">Loading your document...</p>
      </div>
    );
  }

  if (state === STATE.ERROR) {
    const code = error?.response?.data?.error?.code;
    const map = {
      'DOCUMENT_EXPIRED': {
        title:     'Document Expired',
        message:   'The signing window for this document has closed. Please contact the sender for a new link.',
        icon:      Clock,
        iconClass: 'text-amber-500',
        bgClass:   'bg-amber-100',
      },
      'DOCUMENT_NOT_ACTIVE': {
        title:     'Document Unavailable',
        message:   'This document is no longer active. It may have been completed, cancelled, or archived.',
        icon:      XCircle,
        iconClass: 'text-gray-500',
        bgClass:   'bg-gray-100',
      },
      'ALREADY_SIGNED': {
        title:     'Already Signed',
        message:   'You have already completed your portion of this document. No further action is required.',
        icon:      CheckCircle,
        iconClass: 'text-emerald-500',
        bgClass:   'bg-emerald-100',
      },
      'NOT_YOUR_TURN': {
        title:     'Not Your Turn Yet',
        message:   'This document follows a sequential signing order. You will be notified when it is your turn.',
        icon:      Clock,
        iconClass: 'text-indigo-500',
        bgClass:   'bg-indigo-100',
      },
    };
    const screen = map[code] ?? {
      title:   'Link Unavailable',
      message: 'This secure signing link is invalid or has expired. Please request a new link from the document owner.',
    };
    return <ErrorScreen {...screen} />;
  }

  if (state === STATE.SIGNED) {
    return (
      <SuccessScreen
        signerName={signingData?.signer?.name}
        documentTitle={signingData?.document?.title}
        pagesSignedOn={signingData?.pages_to_sign}
        signaturePreview={signaturePreview}
      />
    );
  }

  if (state === STATE.DECLINED) {
    return (
      <ErrorScreen
        title="Signing Declined"
        message="You have chosen not to sign this document. The document owner has been notified of your decision."
        icon={XCircle}
        iconClass="text-red-500"
        bgClass="bg-red-100"
      />
    );
  }

  const { signer, document: doc, fields = [], pages_to_sign: pagesToSign = [], total_fields } = signingData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">{doc.title}</p>
              {doc.company && <p className="text-xs text-indigo-600 font-medium mt-0.5">{doc.company.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <ExpiryBadge expiresAt={doc.expires_at} />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-700">
                {getInitials(signer.name)}
              </div>
              <span className="text-sm text-gray-700 font-medium">{signer.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
        
        {/* Signer Task Summary */}
        <div className="mb-8 p-6 bg-indigo-600 rounded-xl text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <PenLine size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">Signature Required</h2>
              <p className="text-indigo-100 text-sm">Please review the document and apply your signature to the designated fields.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {pagesToSign.map(p => (
              <span key={p} className="px-3 py-1 bg-white/10 rounded-md text-xs font-medium backdrop-blur-sm">
                Page {p}
              </span>
            ))}
            <span className="px-3 py-1 bg-white/10 rounded-md text-xs font-medium backdrop-blur-sm">
              {total_fields} field{total_fields > 1 ? 's' : ''} to sign
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Document Preview */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm sticky top-24">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">Document Preview</p>
                </div>
                <button 
                  onClick={() => window.open(doc.pdf_url ?? doc.file_url, '_blank')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  Open full <ArrowRight size={12} />
                </button>
              </div>
              <div className="relative aspect-[1/1.414] bg-gray-100">
                <iframe
                  src={`${doc.pdf_url ?? doc.file_url}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none pointer-events-none"
                  title="Document Content"
                />
                <div 
                  className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/5 transition-colors group"
                  onClick={() => window.open(doc.pdf_url ?? doc.file_url, '_blank')}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-gray-700">
                    Click to view full document
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-5 space-y-6">
            {!declineMode ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Apply Your Signature</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose a method below. Your signature will be placed at the designated locations.
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  <SignatureInput
                    method={method}
                    setMethod={setMethod}
                    sigPadRef={sigPadRef}
                    uploadFile={uploadFile}
                    setUploadFile={setUploadFile}
                    uploadPreview={uploadPreview}
                    setUploadPreview={setUploadPreview}
                  />

                  {/* Stamp Preview */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50">
                    <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-600">Signature Preview</p>
                      <Badge variant="indigo" size="xs">Will be stamped</Badge>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="h-16 bg-white rounded-lg border border-dashed border-gray-200 flex items-center justify-center px-4">
                        {method === 'upload' && uploadPreview ? (
                          <img src={uploadPreview} alt="Preview" className="max-h-full object-contain" />
                        ) : method === 'draw' && sigPadRef.current && !sigPadRef.current.isEmpty() ? (
                          <img src={sigPadRef.current.toDataURL('image/png')} alt="Preview" className="max-h-full object-contain" />
                        ) : (
                          <p className="text-xs text-gray-400">Create your signature above</p>
                        )}
                      </div>
                      <div className="pt-3 border-t border-gray-100 space-y-1">
                        <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                        <p className="text-xs text-gray-500">{signer.email}</p>
                        <p className="text-xs text-gray-400">
                          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleSubmit}
                      loading={submitMut.isPending}
                    >
                      <CheckCircle size={18} /> Complete Signing
                    </Button>

                    <button
                      onClick={() => setDeclineMode(true)}
                      className="w-full text-sm text-gray-500 hover:text-red-600 py-2 transition-colors"
                    >
                      Decline to sign
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-red-100 bg-red-50">
                  <h2 className="text-lg font-semibold text-red-900">Decline Document</h2>
                  <p className="text-sm text-red-700 mt-1">
                    Provide a reason for declining. The document owner will be notified.
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Reason *</label>
                    <textarea
                      rows={4}
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                      placeholder="e.g. I need to review the terms further..."
                      className="w-full border border-gray-300 focus:border-indigo-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    />
                    <p className="text-xs text-gray-500 text-right">Minimum 5 characters</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" className="w-full"
                      onClick={() => { setDeclineMode(false); setDeclineReason(''); }}>
                      Cancel
                    </Button>
                    <Button variant="danger" className="w-full"
                      disabled={declineReason.trim().length < 5}
                      loading={declineMut.isPending}
                      onClick={() => declineMut.mutate()}>
                      Confirm Decline
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
              <Shield size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">Secure Signing</p>
                <p className="text-xs text-emerald-700 mt-1">Your electronic signature is legally binding. This document is protected with end-to-end encryption.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="py-6 text-center border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500">Powered bbby Signflow</p>
      </footer>
    </div>
  );
}
