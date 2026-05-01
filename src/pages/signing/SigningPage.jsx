import { useEffect, useRef, useState } from 'react';
import { useParams }            from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import SignatureCanvas           from 'react-signature-canvas';
import { signingApi }           from '@/api/signing.api';
import { Button }               from '@/components/ui/Button';
import { Spinner }              from '@/components/ui/Spinner';
import { formatDateTime }       from '@/utils/helpers';
import {
  CheckCircle, XCircle, RotateCcw, PenLine,
  AlertCircle, Upload, Clock, X,
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
        <div className={`w-16 h-16 ${bgClass} rounded-full flex items-center justify-center mx-auto mb-5`}>
          <Icon size={28} className={iconClass} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
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

  if (isExpired) return null; // handled by backend

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
      isExpiringSoon
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-gray-100 text-gray-500'
    }`}>
      <Clock size={12} />
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

    // Validate type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Only PNG or JPG images are accepted.');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB.');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target.result);
    reader.readAsDataURL(file);
    toast.success('Signature image selected.');
  };

  const clearUpload = () => {
    setUploadFile(null);
    setUploadPreview(null);
  };

  return (
    <div className="space-y-4">
      {/* Method switcher */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f3f4f6' }}>
        <button
          onClick={() => setMethod('draw')}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: method === 'draw' ? 'white' : 'transparent',
            color:      method === 'draw' ? '#1e1b4b' : '#6b7280',
            boxShadow:  method === 'draw' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <PenLine size={14} />
          Draw signature
        </button>
        <button
          onClick={() => setMethod('upload')}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: method === 'upload' ? 'white' : 'transparent',
            color:      method === 'upload' ? '#1e1b4b' : '#6b7280',
            boxShadow:  method === 'upload' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <Upload size={14} />
          Upload image
        </button>
      </div>

      {/* Draw mode */}
      {method === 'draw' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Draw your signature <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => sigPadRef.current?.clear()}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} /> Clear
            </button>
          </div>
          <div
            className="rounded-xl overflow-hidden transition-colors"
            style={{
              border: '2px dashed #c7d2fe',
              background: '#fafafa',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#818cf8'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#c7d2fe'}
          >
            <SignatureCanvas
              ref={sigPadRef}
              penColor="#1e1b4b"
              canvasProps={{
                className: 'w-full',
                style: { display: 'block', width: '100%', height: 160 },
              }}
              backgroundColor="rgba(250,250,250,1)"
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            Use mouse, finger, or stylus to sign
          </p>
        </div>
      )}

      {/* Upload mode */}
      {method === 'upload' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Upload signature image <span className="text-red-500">*</span>
          </label>

          {!uploadPreview ? (
            <label
              className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all"
              style={{
                height:     160,
                border:     '2px dashed #c7d2fe',
                background: '#fafafa',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#818cf8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#c7d2fe'}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Upload size={22} className="text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Click to upload</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG or JPG · max 2MB</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border-2 border-indigo-300 bg-gray-50"
              style={{ height: 160 }}>
              <img
                src={uploadPreview}
                alt="Signature preview"
                className="w-full h-full object-contain p-3"
              />
              <button
                onClick={clearUpload}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
              >
                <X size={13} />
              </button>
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  ✓ Ready to use
                </span>
              </div>
            </div>
          )}

          {/* Requirements */}
          <div className="rounded-xl px-4 py-3 bg-amber-50 border border-amber-100 space-y-1">
            <p className="text-xs font-semibold text-amber-800">Image requirements</p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc pl-4">
              <li>PNG or JPG format only</li>
              <li>Maximum 2MB file size</li>
              <li>Use a white or transparent background for best results</li>
              <li>Minimum 200×60px recommended</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ signerName, documentTitle, pagesSignedOn, signaturePreview }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-lg w-full overflow-hidden">
        <div className="px-8 py-7 text-center" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Document Signed!</h2>
          <p className="text-green-100 text-sm mt-1">Thank you, {signerName}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm text-gray-500">You have successfully signed</p>
            <p className="text-base font-semibold text-gray-900 mt-1">"{documentTitle}"</p>
          </div>

          {pagesSignedOn?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Pages you signed
              </p>
              <div className="flex flex-wrap gap-2">
                {pagesSignedOn.map(p => (
                  <div key={p}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
                    <CheckCircle size={12} className="text-green-500" />
                    Page {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {signaturePreview && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Your signature
              </p>
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-center"
                style={{ minHeight: 80 }}>
                <img src={signaturePreview} alt="Your signature"
                  className="max-h-16 object-contain" />
              </div>
            </div>
          )}

          {/* Stamp preview info */}
          <div className="rounded-xl px-4 py-3 bg-indigo-50 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-800 mb-1">What appears on the document</p>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Your signature image is stamped at the designated position, along with your
              name, email, and the date and time of signing.
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
            The document owner has been notified. You can safely close this window.
          </p>
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
  const [method, setMethod]                 = useState('draw');   // 'draw' | 'upload'
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
      // Show validation errors clearly
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

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (state === STATE.LOADING) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error screens ─────────────────────────────────────────────────────────────
  if (state === STATE.ERROR) {
    const code = error?.response?.data?.error?.code;
    const map  = {
      'DOCUMENT_EXPIRED':     { title: 'Document Expired',     message: 'This document has expired and can no longer be signed.', icon: Clock, iconClass: 'text-orange-500', bgClass: 'bg-orange-100' },
      'ALREADY_SIGNED':       { title: 'Already Signed',       message: 'You have already signed this document.', icon: CheckCircle, iconClass: 'text-green-500', bgClass: 'bg-green-100' },
      'NOT_YOUR_TURN':        { title: 'Not Your Turn Yet',    message: 'The previous signer has not completed yet. You will receive an email when it is your turn.', icon: AlertCircle, iconClass: 'text-yellow-500', bgClass: 'bg-yellow-100' },
      'DOCUMENT_NOT_ACTIVE':  { title: 'Document Unavailable', message: 'This document is no longer available for signing.' },
    };
    return <ErrorScreen {...(map[code] ?? { title: 'Invalid Link', message: 'This signing link is invalid or has expired.' })} />;
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
        message="You have declined to sign this document. The document owner has been notified."
        icon={XCircle}
        iconClass="text-orange-500"
        bgClass="bg-orange-100"
      />
    );
  }

  // ── Ready ─────────────────────────────────────────────────────────────────────
  const { signer, document: doc, fields = [], pages_to_sign: pagesToSign = [], total_fields } = signingData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
              {doc.company && <p className="text-xs text-gray-400">{doc.company.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ExpiryBadge expiresAt={doc.expires_at} />
            <span className="text-xs font-medium text-gray-600 hidden sm:block">
              {signer.name}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Pages info */}
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <PenLine size={18} className="text-indigo-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-900">
              Sign {total_fields} field{total_fields > 1 ? 's' : ''} on{' '}
              {pagesToSign.length} page{pagesToSign.length > 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {pagesToSign.map(p => (
                <span key={p} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  Page {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* PDF preview */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Document preview</p>
            <p className="text-xs text-gray-400">Review before signing</p>
          </div>
          <iframe
            src={`${doc.pdf_url ?? doc.file_url}#toolbar=0&navpanes=0`}
            className="w-full border-none"
            style={{ height: 560 }}
            title="Document"
          />
        </div>

        {/* Signature section */}
        {!declineMode ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Your signature</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Your signature will be applied to all {total_fields} field{total_fields > 1 ? 's' : ''}.
                The document will also show your name, email, and signing date.
              </p>
            </div>

            <div className="p-5 space-y-5">
              {/* Signer info */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 text-sm">
                  {signer.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{signer.name}</p>
                  <p className="text-xs text-gray-500">{signer.email}</p>
                </div>
              </div>

              {/* Signature input — draw or upload */}
              <SignatureInput
                method={method}
                setMethod={setMethod}
                sigPadRef={sigPadRef}
                uploadFile={uploadFile}
                setUploadFile={setUploadFile}
                uploadPreview={uploadPreview}
                setUploadPreview={setUploadPreview}
              />

              {/* What will be stamped */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    What will be stamped on the document
                  </p>
                </div>
                <div className="p-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-2">
                    {/* Signature image placeholder */}
                    <div className="h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                      <p className="text-xs text-gray-400 italic">
                        {method === 'draw' ? 'Your drawn signature' : 'Your uploaded signature image'}
                      </p>
                    </div>
                    {/* Divider */}
                    <div className="border-t border-gray-300" />
                    {/* Info block */}
                    <div className="space-y-0.5">
                      <p className="text-xs text-gray-400 italic">Signed by</p>
                      <p className="text-xs font-bold text-gray-800">{signer.name}</p>
                      <p className="text-xs text-gray-500">{signer.email}</p>
                      <p className="text-xs text-gray-400 italic">
                        Signed: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry warning if expiring soon */}
              {doc.expires_at && (() => {
                const h = Math.floor((new Date(doc.expires_at) - new Date()) / (1000*60*60));
                return h < 24 && h >= 0 ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-800 font-medium">
                      This document expires in {h}h — please sign before it expires.
                    </p>
                  </div>
                ) : null;
              })()}

              {/* Submit button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                loading={submitMut.isPending}
              >
                <CheckCircle size={16} />
                Sign document
              </Button>

              {/* Decline */}
              <button
                onClick={() => setDeclineMode(true)}
                className="w-full text-sm text-gray-400 hover:text-red-500 py-2 transition-colors text-center"
              >
                I decline to sign this document
              </button>
            </div>
          </div>
        ) : (
          /* Decline form */
          <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-red-100 bg-red-50">
              <h2 className="text-base font-semibold text-red-800">Decline to sign</h2>
              <p className="text-sm text-red-600 mt-0.5">
                Please provide a reason. The document owner will be notified.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                rows={4}
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                placeholder="I am declining because..."
                className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              {declineReason.trim().length > 0 && declineReason.trim().length < 5 && (
                <p className="text-xs text-red-500">Please provide at least 5 characters.</p>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1"
                  onClick={() => { setDeclineMode(false); setDeclineReason(''); }}>
                  Go back
                </Button>
                <Button variant="danger" className="flex-1"
                  disabled={declineReason.trim().length < 5}
                  loading={declineMut.isPending}
                  onClick={() => declineMut.mutate()}>
                  <XCircle size={15} /> Decline
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}