import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { signApi } from '@/api/sign.api';
import { Button } from '@/components/ui/Button';
import {
  PenLine, Type, Upload, CheckCircle, XCircle,
  AlertTriangle, RotateCcw, FileText,
  Bookmark, Trash2, LogOut, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PAGE_GAP = 8;
const SCREEN_DPI = 96;
const PDF_PTS = 72;

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', css: "'Dancing Script', cursive" },
  { name: 'Great Vibes', css: "'Great Vibes', cursive" },
  { name: 'Pacifico', css: "'Pacifico', cursive" },
  { name: 'Satisfy', css: "'Satisfy', cursive" },
  { name: 'Allura', css: "'Allura', cursive" },
];

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function DrawTab({ onSignatureReady }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPt = useRef(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPoint = (e, rect) => {
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const start = useCallback(e => {
    e.preventDefault();
    drawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    lastPt.current = getPoint(e, rect);
  }, []);

  const move = useCallback(e => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pt = getPoint(e, rect);
    const last = lastPt.current;

    ctx.beginPath();
    ctx.moveTo(last.x * scaleX, last.y * scaleY);
    ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPt.current = pt;
    if (!hasDrawn) setHasDrawn(true);
  }, [hasDrawn]);

  const stop = useCallback(() => {
    drawing.current = false;
    if (hasDrawn) onSignatureReady(canvasRef.current.toDataURL('image/png'));
  }, [hasDrawn, onSignatureReady]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureReady(null);
  }, [onSignatureReady]);

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-gray-200 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={560}
          height={180}
          className="w-full h-[180px] block cursor-crosshair touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerLeave={stop}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <PenLine size={20} className="text-gray-300 mb-1.5" />
            <p className="text-xs text-gray-400">Draw your signature here</p>
            <p className="text-[11px] text-gray-300 mt-1">Use mouse or touchscreen</p>
          </div>
        )}
      </div>
      {hasDrawn && (
        <div className="flex justify-end mt-2">
          <Button size="xs" variant="secondary" onClick={clear}>
            <RotateCcw size={12} /> Clear
          </Button>
        </div>
      )}
    </div>
  );
}

function TypeTab({ signerName, onSignatureReady }) {
  const [text, setText] = useState(signerName || '');
  const [fontIdx, setFontIdx] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    const id = 'signflow-gfonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Allura&display=swap';
    document.head.appendChild(link);
  }, []);

  const renderToCanvas = useCallback(async (txt, fIdx) => {
    const canvas = canvasRef.current;
    if (!canvas || !txt.trim()) { onSignatureReady(null); return; }
    const font = SIGNATURE_FONTS[fIdx];
    const fontFamily = font.css.replace(/,.*$/, '').trim();

    try { await document.fonts.load(`bold 56px ${fontFamily}`); } catch {}

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let fontSize = 60;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    while (ctx.measureText(txt).width > canvas.width * 0.88 && fontSize > 20) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
    }

    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, canvas.width / 2, canvas.height / 2);

    onSignatureReady(canvas.toDataURL('image/png'));
  }, [onSignatureReady]);

  useEffect(() => { renderToCanvas(text, fontIdx); }, [text, fontIdx, renderToCanvas]);

  const font = SIGNATURE_FONTS[fontIdx];

  return (
    <div className="flex flex-col gap-3">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your name"
        className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-inherit box-border"
      />
      <div className="flex gap-1.5 flex-wrap">
        {SIGNATURE_FONTS.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setFontIdx(i)}
            className={`px-3.5 py-1.5 rounded-lg text-base border transition-all ${
              fontIdx === i
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
            style={{ fontFamily: f.css }}
          >
            {text || 'Sign'}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={560} height={180} className="hidden" />
      {text.trim() ? (
        <div className="p-5 rounded-xl bg-white border border-gray-200 text-center min-h-[80px] flex items-center justify-center">
          <span style={{ fontFamily: font.css, fontSize: 48, color: '#1e293b', fontWeight: 700 }}>
            {text}
          </span>
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center text-gray-400 text-xs">
          Type your name above to preview
        </div>
      )}
    </div>
  );
}

function UploadTab({ savedSignature, onSignatureReady }) {
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const toPngDataUri = (dataUri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUri);
      img.src = dataUri;
    });
  };

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUri = ev.target.result;
      setPreview(dataUri);
      const pngUri = await toPngDataUri(dataUri);
      onSignatureReady(pngUri);
    };
    reader.readAsDataURL(file);
  };

  const useSaved = useCallback(() => {
    setPreview(savedSignature);
    onSignatureReady(savedSignature);
  }, [savedSignature, onSignatureReady]);

  const clear = useCallback(() => {
    setPreview(null);
    onSignatureReady(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onSignatureReady]);

  return (
    <div className="flex flex-col gap-3">
      {savedSignature && !preview && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3.5 py-2.5 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark size={13} className="text-indigo-400" />
              <span className="text-xs font-semibold text-gray-500">Saved signature</span>
            </div>
            <button
              onClick={useSaved}
              className="px-3 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 cursor-pointer font-inherit"
            >
              Use this
            </button>
          </div>
          <div className="bg-white p-3 text-center">
            <img src={savedSignature} alt="Saved signature" className="max-h-[70px] max-w-full inline-block" />
          </div>
        </div>
      )}

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="py-8 px-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <Upload size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500 mb-1">Click to upload your signature</p>
          <p className="text-[11px] text-gray-400">PNG, JPG, SVG — max 2 MB</p>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-white p-5 text-center">
            <img src={preview} alt="Signature preview" className="max-h-[120px] max-w-full inline-block" />
          </div>
          <div className="px-3.5 py-2.5 bg-gray-50 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Signature ready</span>
            <button
              onClick={clear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-500 border border-red-200 cursor-pointer font-inherit"
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeclineModal({ open, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-7">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <XCircle size={22} className="text-red-500" />
        </div>
        <h3 className="text-center text-lg font-bold text-gray-900 mb-1">Decline to sign?</h3>
        <p className="text-center text-sm text-gray-500 mb-5">
          The document owner will be notified. This cannot be undone.
        </p>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. I do not agree with clause 5..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-white border border-gray-200 text-gray-900 resize-vertical focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-inherit box-border"
          />
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" className="flex-1 rounded-lg" onClick={onClose}>Cancel</Button>
          <Button variant="danger" className="flex-1 rounded-lg" loading={loading} onClick={() => onConfirm(reason)}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SigningPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser);

  const [signingData, setSigningData] = useState(null);
  const [savedSignature, setSavedSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [emailMismatch, setEmailMismatch] = useState(false);

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [pageW, setPageW] = useState(794);
  const [pageH, setPageH] = useState(1123);
  const [pdfError, setPdfError] = useState(false);

  const [sigTab, setSigTab] = useState('draw');
  const [signatureData, setSignatureData] = useState(null);
  const [saveToAccount, setSaveToAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDecline, setShowDecline] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate(`/sign/${token}`, { replace: true });
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const [sigRes, savedRes] = await Promise.allSettled([
          signApi.getSigningData(token),
          signApi.getSavedSignature(),
        ]);

        if (sigRes.status === 'fulfilled') {
          const data = sigRes.value.data;
          setSigningData(data);

          const currentUser = getCurrentUser();
          if (currentUser && data.signer.email.toLowerCase() !== currentUser.email.toLowerCase()) {
            setEmailMismatch(true);
          }

          if (data.signer.status === 'signed') {
            navigate(`/sign/${token}/thank-you`, { replace: true });
            return;
          }
        } else {
          setLoadError(sigRes.reason?.response?.data?.message || 'Invalid signing link.');
        }

        if (savedRes.status === 'fulfilled' && savedRes.value.data.has_signature) {
          setSavedSignature(savedRes.value.data.saved_signature);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    const pdfUrl = signingData?.document?.preview_url;
    if (!pdfUrl) return;
    let alive = true;
    let objectUrl = null;

    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(pdfUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to load PDF');
        const blob = await res.blob();
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
        setPdfError(false);
      } catch (err) {
        console.error('PDF load failed:', err);
        setPdfError(true);
      }
    })();

    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [signingData?.document?.preview_url]);

  const onPdfLoad = useCallback(async (pdfProxy) => {
    setTotalPages(pdfProxy.numPages);
    try {
      const page = await pdfProxy.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const scale = SCREEN_DPI / PDF_PTS;
      setPageW(Math.round(viewport.width * scale));
      setPageH(Math.round(viewport.height * scale));
    } catch {}
  }, []);

  const fieldsByPage = useMemo(() => {
    if (!signingData?.fields) return {};
    return signingData.fields.reduce((acc, f) => {
      if (!acc[f.page]) acc[f.page] = [];
      acc[f.page].push(f);
      return acc;
    }, {});
  }, [signingData]);

  const handleSign = async () => {
    if (!signatureData) { toast.error('Please create your signature first.'); return; }
    setSubmitting(true);
    try {
      if (saveToAccount) {
        await signApi.saveSignature(signatureData).catch(() => {});
      }
      await signApi.submit(token, signatureData);
      setOtpSent(true);
      toast.success('OTP sent to your email! Please check your inbox.');
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === 'EMAIL_MISMATCH') {
        toast.error(err.response.data.message, { duration: 6000 });
      } else {
        toast.error(err?.response?.data?.message || 'Failed to submit signature.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 4) { toast.error('Please enter the OTP sent to your email.'); return; }
    setVerifying(true);
    setOtpError('');
    try {
      await signApi.verifyOtp(token, otp);
      toast.success('Document signed successfully!');
      navigate(`/sign/${token}/thank-you`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid or expired OTP.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleDecline = async (reason) => {
    setDeclining(true);
    try {
      await signApi.decline(token, reason);
      toast.success('You have declined this document.');
      navigate(`/sign/${token}/thank-you?declined=1`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to decline.');
    } finally {
      setDeclining(false);
      setShowDecline(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`/sign/${token}/auth`, { replace: true });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading document…</p>
      </div>
    </div>
  );

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-sm text-center bg-white border border-gray-200 rounded-2xl p-10 shadow-lg">
        <AlertTriangle size={32} className="text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Unable to Load</h2>
        <p className="text-sm text-gray-500 leading-relaxed">{loadError}</p>
      </div>
    </div>
  );

  if (emailMismatch) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-sm w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Wrong Account</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          You are signed in as <strong className="text-gray-700">{user?.email}</strong>, but this document
          must be signed by <strong className="text-red-500">{signingData?.signer?.email}</strong>.
        </p>
        <Button className="w-full rounded-lg" onClick={handleLogout}>
          <LogOut size={14} /> Sign out & use correct account
        </Button>
      </div>
    </div>
  );

  const { signer, document: doc } = signingData;

  if (!signingData.can_sign_now && doc.signing_mode === 'sequential') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-sm w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5">
            <Clock size={24} className="text-indigo-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Not Your Turn Yet</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">
            This document follows a sequential signing order.{' '}
            Turn <strong className="text-indigo-600">{doc.current_signing_order}</strong> needs to sign first.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            You will receive an email notification when it is your turn to sign.
          </p>
          <Button variant="secondary" className="rounded-lg" onClick={handleLogout}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  const sigTabs = [
    { key: 'draw', label: 'Draw', icon: PenLine },
    { key: 'type', label: 'Type', icon: Type },
    { key: 'upload', label: 'Upload', icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-5">
        <div className="max-w-7xl mx-auto h-12 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-gray-900 truncate min-w-0">{doc.title}</p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-gray-400 hidden sm:inline">{signer.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-all cursor-pointer font-inherit"
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-5 lg:p-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* PDF preview */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <FileText size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">
              {signingData.total_fields} field{signingData.total_fields > 1 ? 's' : ''} on {signingData.pages_to_sign.length} page{signingData.pages_to_sign.length > 1 ? 's' : ''}
            </span>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {signingData.pages_to_sign.map(p => (
                <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                  P{p}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto max-h-[75vh] bg-gray-50/50 py-4">
            {pdfBlobUrl ? (
              <div className="flex justify-center">
                <div className="relative" style={{ width: pageW }}>
                  <Document
                    file={pdfBlobUrl}
                    onLoadSuccess={onPdfLoad}
                    loading={null}
                  >
                    {Array.from({ length: totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      const pageFields = fieldsByPage[pageNum] || [];

                      return (
                        <div key={i} className={`relative ${i < totalPages - 1 ? 'mb-2' : ''}`}>
                          <Page
                            pageNumber={pageNum}
                            width={pageW}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                          />
                          {pageFields.map(field => {
                            const signed = !!signatureData;
                            return (
                              <div
                                key={field.id}
                                className={`absolute border-2 rounded-md flex items-center justify-center transition-all cursor-default z-10 overflow-hidden ${
                                  signed ? 'border-emerald-400 bg-emerald-50/20' : 'border-amber-400 bg-amber-50/20'
                                }`}
                                style={{
                                  left: field.position.x,
                                  top: field.position.y,
                                  width: field.position.width || 200,
                                  height: field.position.height || 60,
                                }}
                              >
                                {signed ? (
                                  <img
                                    src={signatureData}
                                    alt="signature"
                                    className="max-w-full max-h-full object-contain"
                                  />
                                ) : (
                                  <div className="text-center">
                                    <PenLine size={14} className="text-amber-500 mx-auto" />
                                    <p className="text-[9px] text-amber-600 mt-0.5 font-bold">SIGN HERE</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </Document>
                </div>
              </div>
            ) : pdfError ? (
              <div className="py-10 text-center text-gray-400">
                <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
                <p className="text-sm mb-2">PDF preview unavailable</p>
                <p className="text-xs text-gray-400">You can still sign the document below</p>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-300">
                <FileText size={32} className="mx-auto mb-3" />
                <p className="text-sm">PDF preview loading…</p>
              </div>
            )}
          </div>
        </div>

        {/* Signing panel */}
        <div className="flex flex-col gap-4">

          {/* Signer info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Signing as</p>
            <p className="text-sm font-bold text-gray-900">{signer.name}</p>
            <p className="text-xs text-gray-500">{signer.email}</p>
          </div>

          {/* Saved signature */}
          {savedSignature && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark size={13} className="text-indigo-400" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saved Signature</span>
                </div>
                <button
                  onClick={() => {
                    setSignatureData(savedSignature);
                    toast.success('Saved signature selected!');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer font-inherit ${
                    signatureData === savedSignature
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  {signatureData === savedSignature ? 'Selected' : 'Use'}
                </button>
              </div>
              <div className="p-4 flex items-center justify-center bg-gray-50/30">
                <img src={savedSignature} alt="Saved signature" className="max-h-[60px] max-w-full block" />
              </div>
            </div>
          )}

          {/* Signature creation */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex">
              {sigTabs.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => { setSigTab(t.key); setSignatureData(null); }}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer font-inherit ${
                      sigTab === t.key
                        ? 'text-indigo-600 border-indigo-500 bg-white'
                        : 'text-gray-400 border-transparent hover:text-gray-600 bg-gray-50/50'
                    }`}
                  >
                    <Icon size={13} /> {t.label}
                  </button>
                );
              })}
            </div>
            <div className="p-4">
              {sigTab === 'draw' && <DrawTab onSignatureReady={setSignatureData} />}
              {sigTab === 'type' && <TypeTab signerName={signer.name} onSignatureReady={setSignatureData} />}
              {sigTab === 'upload' && <UploadTab savedSignature={savedSignature} onSignatureReady={setSignatureData} />}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToAccount}
                  onChange={e => setSaveToAccount(e.target.checked)}
                  className="w-3.5 h-3.5 accent-indigo-500"
                />
                <span className="text-xs text-gray-500">Save signature for future use</span>
              </label>
            </div>
          </div>

          {/* OTP section */}
          {otpSent && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
              <p className="text-xs text-gray-500 text-center">
                OTP sent to <strong className="text-gray-700">{signingData?.signer?.email}</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter OTP"
                maxLength={6}
                className={`w-full px-4 py-3 rounded-xl text-lg font-bold text-center tracking-[0.5em] bg-white border ${
                  otpError ? 'border-red-300' : 'border-gray-200'
                } text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-inherit box-border`}
              />
              {otpError && (
                <p className="text-xs text-red-500 text-center">{otpError}</p>
              )}
            </div>
          )}

          {/* Signature ready indicator */}
          {signatureData && !otpSent && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-emerald-700">Signature ready — place it on the document fields</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={otpSent ? handleVerify : handleSign}
              disabled={(otpSent ? verifying : submitting) || !signatureData}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-inherit ${
                (otpSent ? verifying : submitting) || !signatureData
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
              }`}
            >
              {otpSent ? (
                verifying ? 'Verifying…' : 'Verify OTP'
              ) : (
                <><CheckCircle size={16} />{submitting ? 'Signing…' : 'Sign Document'}</>
              )}
            </button>

            <button
              onClick={() => setShowDecline(true)}
              disabled={submitting || verifying}
              className="w-full py-3 rounded-xl text-sm font-semibold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all cursor-pointer font-inherit flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle size={14} /> Decline to sign
            </button>
          </div>

          <p className="text-[10px] text-gray-300 text-center leading-relaxed">
            By clicking "Sign Document" you agree that your electronic signature is legally binding.
            Powered by Signflow.
          </p>
        </div>
      </div>

      <DeclineModal
        open={showDecline}
        onClose={() => setShowDecline(false)}
        onConfirm={handleDecline}
        loading={declining}
      />
    </div>
  );
}
