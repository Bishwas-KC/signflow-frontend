// src/pages/sign/SigningPage.jsx
// Full signing page shown after the signer is authenticated.
// Features:
//   • PDF viewer with highlighted signature fields
//   • 3-tab signature input: Draw (canvas), Type (fonts), Upload (image)
//   • Saved signature: load from account, use directly
//   • Save new signature to account (with checkbox)
//   • Submit / Decline flow

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { signApi } from '@/api/sign.api';
import {
  PenLine, Type, Upload, CheckCircle, XCircle,
  AlertTriangle, RotateCcw, FileText, ShieldCheck,
  ChevronDown, Bookmark, Trash2, LogOut, User, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_GAP   = 8;
const SCREEN_DPI = 96;
const PDF_PTS    = 72;

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', css: "'Dancing Script', cursive" },
  { name: 'Great Vibes',    css: "'Great Vibes', cursive" },
  { name: 'Pacifico',       css: "'Pacifico', cursive" },
  { name: 'Satisfy',        css: "'Satisfy', cursive" },
  { name: 'Allura',         css: "'Allura', cursive" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ── Draw Tab ──────────────────────────────────────────────────────────────────
function DrawTab({ onSignatureReady }) {
  const canvasRef  = useRef(null);
  const drawing    = useRef(false);
  const lastPt     = useRef(null);
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
    const ctx    = canvas.getContext('2d');
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const pt     = getPoint(e, rect);
    const last   = lastPt.current;

    ctx.beginPath();
    ctx.moveTo(last.x * scaleX, last.y * scaleY);
    ctx.lineTo(pt.x  * scaleX, pt.y  * scaleY);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();

    lastPt.current = pt;
    if (!hasDrawn) setHasDrawn(true);
  }, [hasDrawn]);

  const stop = useCallback(() => {
    drawing.current = false;
    if (hasDrawn) {
      onSignatureReady(canvasRef.current.toDataURL('image/png'));
    }
  }, [hasDrawn, onSignatureReady]);

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureReady(null);
  };

  return (
    <div>
      <div style={{
        position: 'relative', borderRadius: 12,
        border: '1px dashed #334155', background: '#ffffff', overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          width={560}
          height={180}
          style={{ width: '100%', height: 180, display: 'block', cursor: 'crosshair', touchAction: 'none' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerLeave={stop}
        />
        {!hasDrawn && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <PenLine size={20} style={{ color: '#cbd5e1', marginBottom: 6 }} />
            <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>Draw your signature here</p>
            <p style={{ fontSize: 11, color: '#e2e8f0', margin: '4px 0 0' }}>Use mouse or touchscreen</p>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={clear}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            color: '#64748b', background: '#1e293b', border: '1px solid #334155',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <RotateCcw size={12} /> Clear
        </button>
      </div>
    </div>
  );
}

// ── Type Tab ──────────────────────────────────────────────────────────────────
function TypeTab({ signerName, onSignatureReady }) {
  const [text,        setText]        = useState(signerName || '');
  const [fontIdx,     setFontIdx]     = useState(0);
  const canvasRef = useRef(null);

  // Load Google Fonts once
  useEffect(() => {
    const id = 'signflow-gfonts';
    if (document.getElementById(id)) return;
    const link   = document.createElement('link');
    link.id      = id;
    link.rel     = 'stylesheet';
    link.href    = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Allura&display=swap';
    document.head.appendChild(link);
  }, []);

  const renderToCanvas = useCallback(async (txt, fIdx) => {
    const canvas  = canvasRef.current;
    if (!canvas || !txt.trim()) { onSignatureReady(null); return; }
    const font    = SIGNATURE_FONTS[fIdx];

    try { await document.fonts.load(`bold 56px ${font.css}`); } catch {}

    const ctx     = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fit text
    let fontSize  = 60;
    ctx.font      = `bold ${fontSize}px ${font.css}`;
    while (ctx.measureText(txt).width > canvas.width * 0.88 && fontSize > 20) {
      fontSize -= 2;
      ctx.font  = `bold ${fontSize}px ${font.css}`;
    }

    ctx.fillStyle    = '#1e293b';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, canvas.width / 2, canvas.height / 2);

    onSignatureReady(canvas.toDataURL('image/png'));
  }, [onSignatureReady]);

  useEffect(() => { renderToCanvas(text, fontIdx); }, [text, fontIdx]);

  const font = SIGNATURE_FONTS[fontIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your name"
        style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13,
          background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0',
          outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
        }}
      />

      {/* Font selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SIGNATURE_FONTS.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setFontIdx(i)}
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: fontIdx === i ? 'rgba(99,102,241,0.15)' : '#1e293b',
              border: `1px solid ${fontIdx === i ? '#6366f1' : '#334155'}`,
              color: fontIdx === i ? '#a5b4fc' : '#64748b',
              cursor: 'pointer', fontSize: 18, fontFamily: f.css,
              transition: 'all 0.15s',
            }}
          >
            {text || 'Sign'}
          </button>
        ))}
      </div>

      {/* Preview canvas (hidden — used for rendering) */}
      <canvas ref={canvasRef} width={560} height={180} style={{ display: 'none' }} />

      {/* Visual preview */}
      {text.trim() && (
        <div style={{
          padding: '20px 24px', borderRadius: 12,
          background: '#ffffff', border: '1px solid #e2e8f0',
          textAlign: 'center', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: font.css, fontSize: 48, color: '#1e293b', fontWeight: 700 }}>
            {text}
          </span>
        </div>
      )}
      {!text.trim() && (
        <div style={{
          padding: '20px 24px', borderRadius: 12,
          background: '#0f172a', border: '1px dashed #334155',
          textAlign: 'center', color: '#334155', fontSize: 12,
        }}>
          Type your name above to preview
        </div>
      )}
    </div>
  );
}

// ── Upload Tab ─────────────────────────────────────────────────────────────────
function UploadTab({ savedSignature, onSignatureReady }) {
  const [preview, setPreview] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const inputRef = useRef(null);

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB.'); return; }

    const reader = new FileReader();
    reader.onload = ev => {
      setPreview(ev.target.result);
      setUploadedFile(file); // Store the File object for submission
      onSignatureReady(file); // Pass File object to parent
    };
    reader.readAsDataURL(file);
  };

  const useSaved = () => {
    setPreview(savedSignature);
    setUploadedFile(null);
    onSignatureReady(savedSignature); // Pass base64 string for saved signature
  };

  const clear = () => {
    setPreview(null);
    setUploadedFile(null);
    onSignatureReady(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Saved signature option */}
      {savedSignature && !preview && (
        <div style={{
          borderRadius: 12, border: '1px solid #334155',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px', background: '#1e293b',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bookmark size={13} style={{ color: '#818cf8' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                Saved signature
              </span>
            </div>
            <button
              onClick={useSaved}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
                border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Use this
            </button>
          </div>
          <div style={{ background: '#ffffff', padding: 12, textAlign: 'center' }}>
            <img src={savedSignature} alt="Saved signature" style={{ maxHeight: 70, maxWidth: '100%' }} />
          </div>
        </div>
      )}

      {/* Upload area */}
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            padding: '32px 20px', borderRadius: 12,
            border: '2px dashed #334155', background: '#0f172a',
            textAlign: 'center', cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
          onMouseOut={e => e.currentTarget.style.borderColor = '#334155'}
        >
          <Upload size={24} style={{ color: '#475569', marginBottom: 8 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: '0 0 4px' }}>
            Click to upload your signature
          </p>
          <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>
            PNG, JPG, SVG — max 2 MB
          </p>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ background: '#ffffff', padding: '20px', textAlign: 'center' }}>
            <img src={preview} alt="Signature preview" style={{ maxHeight: 120, maxWidth: '100%' }} />
          </div>
          <div style={{
            padding: '10px 14px', background: '#1e293b',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#475569' }}>Signature ready</span>
            <button
              onClick={clear}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'rgba(239,68,68,0.1)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Decline Modal ─────────────────────────────────────────────────────────────
function DeclineModal({ open, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 420,
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: 28,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <XCircle size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
          Decline to sign?
        </h3>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginBottom: 20 }}>
          The document owner will be notified. This cannot be undone.
        </p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. I do not agree with clause 5..."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px',
              background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
              fontSize: 13, color: '#e2e8f0', resize: 'vertical',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: 'white',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Declining…' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SigningPage() {
  const { token }  = useParams();
  const navigate    = useNavigate();
  const user        = getCurrentUser();

  // ── Data ─────────────────────────────────────────────────────────────────
  const [signingData,     setSigningData]     = useState(null);
  const [savedSignature,  setSavedSignature]  = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [loadError,       setLoadError]       = useState(null);
  const [emailMismatch,   setEmailMismatch]   = useState(false);

  // ── PDF ───────────────────────────────────────────────────────────────────
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [pageW,      setPageW]      = useState(794);
  const [pageH,      setPageH]      = useState(1123);

  // ── Signature ─────────────────────────────────────────────────────────────
  const [sigTab,         setSigTab]         = useState('draw');   // 'draw'|'type'|'upload'
  const [signatureData,  setSignatureData]  = useState(null);     // final data URI
  const [saveToAccount,  setSaveToAccount]  = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [declining,      setDeclining]      = useState(false);
  const [showDecline,    setShowDecline]    = useState(false);

  // ── OTP flow ────────────────────────────────────────────────────────
  const [otpSent,        setOtpSent]        = useState(false);
  const [otp,            setOtp]            = useState("");
  const [verifying,      setVerifying]      = useState(false);
  const [otpError,       setOtpError]       = useState("");
  // ── Auth guard: redirect if not logged in ─────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate(`/sign/${token}`, { replace: true });
    }
  }, [token]);

  // ── Load signing data + saved signature ───────────────────────────────────
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

          // Verify email match
          if (user && data.signer.email.toLowerCase() !== user.email.toLowerCase()) {
            setEmailMismatch(true);
          }

          // If already signed, go to thank you
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

   // ── Load PDF as blob (with auth token) ───────────────────────────────────
   const [pdfError, setPdfError] = useState(false);
   useEffect(() => {
     const pdfUrl = signingData?.document?.pdf_url;
     if (!pdfUrl) return;
     let alive = true;
     let objectUrl = null;

     (async () => {
       try {
         const token = localStorage.getItem('token');
         const res   = await fetch(pdfUrl, {
           headers: token ? { Authorization: `Bearer ${token}` } : {},
         });
         if (!res.ok) throw new Error('Failed to load PDF');
         const blob  = await res.blob();
         if (!alive) return;
         objectUrl   = URL.createObjectURL(blob);
         setPdfBlobUrl(objectUrl);
         setPdfError(false);
       } catch (err) {
         console.error('PDF load failed:', err);
         setPdfError(true);
       }
     })();

     return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
   }, [signingData?.document?.pdf_url]);

  // ── PDF size detection ────────────────────────────────────────────────────
  const onPdfLoad = useCallback(async (pdfProxy) => {
    setTotalPages(pdfProxy.numPages);
    try {
      const page     = await pdfProxy.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const scale    = SCREEN_DPI / PDF_PTS;
      setPageW(Math.round(viewport.width  * scale));
      setPageH(Math.round(viewport.height * scale));
    } catch {}
  }, []);

  // ── Fields grouped by page ────────────────────────────────────────────────
  const fieldsByPage = useMemo(() => {
    if (!signingData?.fields) return {};
    return signingData.fields.reduce((acc, f) => {
      if (!acc[f.page]) acc[f.page] = [];
      acc[f.page].push(f);
      return acc;
    }, {});
  }, [signingData]);

  // ── Submit → Step1: Send OTP ─────────────────────────────
  const handleSubmit = async () => {
    if (!signatureData) { toast.error('Please create your signature first.'); return; }

    // Step2: Verify OTP
    if (otpSent) {
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
      return;
    }

    // Step1: Submit signature → sends OTP to signer's email
    setSubmitting(true);
    try {
      // Optionally save to account (only for draw/type, not file upload)
      if (saveToAccount && !(signatureData instanceof File)) {
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


  // ── Decline ───────────────────────────────────────────────────────────────
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060d1a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid #1e293b', borderTopColor: '#6366f1',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: '#334155', fontSize: 13 }}>Loading document…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (loadError) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060d1a', padding: 24 }}>
      <div style={{ maxWidth: 380, textAlign: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: 40 }}>
        <AlertTriangle size={32} style={{ color: '#f59e0b', marginBottom: 16 }} />
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Unable to Load</h2>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{loadError}</p>
      </div>
    </div>
  );

  // ── Email mismatch warning ────────────────────────────────────────────────
  if (emailMismatch) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060d1a', padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: 36 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertTriangle size={24} style={{ color: '#ef4444' }} />
        </div>
        <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>Wrong Account</h2>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
          You are signed in as <strong style={{ color: '#94a3b8' }}>{user?.email}</strong>, but this document
          must be signed by <strong style={{ color: '#f87171' }}>{signingData?.signer?.email}</strong>.
        </p>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <LogOut size={14} /> Sign out & use correct account
        </button>
      </div>
    </div>
  );

  const { signer, document: doc } = signingData;

  // ── Sequential turn guard ─────────────────────────────────────────────
  if (!signingData.can_sign_now && doc.signing_mode === 'sequential') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060d1a', padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 420, width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: 36, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Clock size={24} style={{ color: '#818cf8' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>Not Your Turn Yet</h2>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            This document follows a sequential signing order.{' '}
            Turn <strong style={{ color: '#a5b4fc' }}>{doc.current_signing_order}</strong> needs to sign first.
          </p>
          <p style={{ fontSize: 12, color: '#334155', marginBottom: 24 }}>
            You will receive an email notification when it is your turn to sign.
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <LogOut size={14} style={{ marginRight: 6 }} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const sigTabs = [
    { key: 'draw',   label: 'Draw',   icon: PenLine },
    { key: 'type',   label: 'Type',   icon: Type    },
    { key: 'upload', label: 'Upload', icon: Upload  },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(6,13,26,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #0f1e35', padding: '0 20px',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', height: 54,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <ShieldCheck size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.title}
              </p>
              {doc.company && (
                <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>{doc.company.name}</p>
              )}
            </div>
          </div>

          {/* Signer info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            padding: '5px 12px', borderRadius: 20,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <User size={12} style={{ color: '#818cf8' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc' }}>
              {signer.name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8,
              fontSize: 11, fontWeight: 600, color: '#475569', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <LogOut size={12} /> Log out
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '24px 20px',
        display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24,
      }}>

        {/* ── Left: PDF viewer ─────────────────────────────────────────────── */}
        <div>
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 16, overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid #1e293b',
              background: '#0a1628', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <FileText size={14} style={{ color: '#475569' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                {signingData.total_fields} signature field{signingData.total_fields > 1 ? 's' : ''} on {signingData.pages_to_sign.length} page{signingData.pages_to_sign.length > 1 ? 's' : ''}
              </span>
              <div style={{
                marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: 4,
              }}>
                {signingData.pages_to_sign.map(p => (
                  <span key={p} style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: 'rgba(245,158,11,0.1)', color: '#fbbf24',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}>
                    P{p}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '75vh', background: '#0f172a', padding: '16px 0' }}>
              {pdfBlobUrl ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: pageW }}>
                    <Document
                      file={pdfBlobUrl}
                      onLoadSuccess={onPdfLoad}
                      loading={null}
                    >
                      {Array.from({ length: totalPages }, (_, i) => {
                        const pageNum    = i + 1;
                        const pageFields = fieldsByPage[pageNum] || [];
                        const pageTop    = i * (pageH + PAGE_GAP);

                        return (
                          <div key={i} style={{ position: 'relative', marginBottom: i < totalPages - 1 ? PAGE_GAP : 0 }}>
                            <Page
                              pageNumber={pageNum}
                              width={pageW}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                            />
                            {/* Field overlays */}
                            {pageFields.map(field => {
                              const absY    = field.position.y;
                              const pageOffset = i * (pageH + PAGE_GAP);
                              const relY    = absY - pageOffset;
                              const signed  = !!signatureData;

                              return (
                                <div
                                  key={field.id}
                                  style={{
                                    position: 'absolute',
                                    left: field.position.x,
                                    top:  relY,
                                    width:  field.position.width  || 200,
                                    height: field.position.height || 60,
                                    border: `2px solid ${signed ? '#10b981' : '#f59e0b'}`,
                                    borderRadius: 6,
                                    background: signed ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s', cursor: 'default', zIndex: 10,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {signed ? (
                                    <img
                                      src={signatureData}
                                      alt="signature"
                                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                  ) : (
                                    <div style={{ textAlign: 'center' }}>
                                      <PenLine size={14} style={{ color: '#f59e0b' }} />
                                      <p style={{ fontSize: 9, color: '#f59e0b', margin: '2px 0 0', fontWeight: 700 }}>
                                        SIGN HERE
                                      </p>
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
                <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
                  <AlertTriangle size={32} style={{ marginBottom: 12, color: '#f59e0b' }} />
                  <p style={{ fontSize: 13, marginBottom: 8 }}>PDF preview unavailable</p>
                  <p style={{ fontSize: 11, color: '#334155' }}>You can still sign the document below</p>
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#334155' }}>
                  <FileText size={32} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 13 }}>PDF preview loading…</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Signature panel ───────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Saved signature quick-use */}
          {savedSignature && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b',
              borderRadius: 16, overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid #1e293b',
                background: '#0a1628', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Bookmark size={13} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Saved Signature
                </span>
              </div>
              <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#ffffff', borderRadius: 8, padding: '8px 12px', flex: 1 }}>
                  <img src={savedSignature} alt="Saved sig" style={{ maxHeight: 50, maxWidth: '100%', display: 'block' }} />
                </div>
                <button
                  onClick={() => {
                    setSignatureData(savedSignature);
                    toast.success('Saved signature selected!');
                  }}
                  style={{
                    padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                    background: signatureData === savedSignature
                      ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                    color: signatureData === savedSignature ? '#34d399' : '#a5b4fc',
                    border: `1px solid ${signatureData === savedSignature ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
                    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                  }}
                >
                  {signatureData === savedSignature ? '✓ Selected' : 'Use'}
                </button>
              </div>
            </div>
          )}

          {/* Signature creator */}
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Tab bar */}
            <div style={{
              display: 'flex', borderBottom: '1px solid #1e293b', background: '#0a1628',
            }}>
              {sigTabs.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => { setSigTab(t.key); setSignatureData(null); }}
                    style={{
                      flex: 1, padding: '12px 0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontSize: 12, fontWeight: sigTab === t.key ? 700 : 500,
                      color: sigTab === t.key ? '#a5b4fc' : '#475569',
                      background: 'transparent', border: 'none',
                      borderBottom: sigTab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={13} /> {t.label}
                  </button>
                );
              })}
            </div>

            <div style={{ padding: 18 }}>
              {sigTab === 'draw' && (
                <DrawTab onSignatureReady={setSignatureData} />
              )}
              {sigTab === 'type' && (
                <TypeTab signerName={signer.name} onSignatureReady={setSignatureData} />
              )}
              {sigTab === 'upload' && (
                <UploadTab savedSignature={savedSignature} onSignatureReady={setSignatureData} />
              )}
            </div>

            {/* Save to account checkbox */}
            <div style={{
              padding: '12px 18px', borderTop: '1px solid #1e293b',
              background: '#0a1628',
            }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', userSelect: 'none',
              }}>
                <input
                  type="checkbox"
                  checked={saveToAccount}
                  onChange={e => setSaveToAccount(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: '#6366f1' }}
                />
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Save this signature to my account for future use
                </span>
              </label>
            </div>
          </div>

          {/* Signature preview status */}
          {signatureData && (
            <div style={{
              padding: '10px 14px', borderRadius: 12,
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>
                Signature ready — review the fields on the document
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleSubmit}
              disabled={(otpSent ? verifying : submitting) || !signatureData}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12,
                fontSize: 15, fontWeight: 700, color: 'white',
                background: (otpSent ? verifying : submitting) || !signatureData
                  ? '#1e293b'
                  : otpSent
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : 'linear-gradient(135deg,#059669,#10b981)',
                border: 'none',
                cursor: (otpSent ? verifying : submitting) || !signatureData ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
                boxShadow: (!otpSent && !submitting && signatureData) ? '0 0 28px rgba(16,185,129,0.35)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {otpSent ? (
                verifying ? 'Verifying…' : 'Verify OTP'
              ) : (
                <>
                  <CheckCircle size={16} />
                  {submitting ? 'Signing document…' : 'Sign Document'}
                </>
              )}
            </button>

            {/* OTP Input - shown after submitting signature */}
            {otpSent && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                  OTP sent to <strong style={{ color: '#e2e8f0' }}>{signingData?.signer?.email}</strong>
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter OTP"
                  maxLength={6}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '12px 16px', borderRadius: 10,
                    fontSize: 18, fontWeight: 700, color: '#e2e8f0',
                    background: '#1e293b', border: `1px solid ${otpError ? '#ef4444' : '#334155'}`,
                    outline: 'none', fontFamily: 'inherit', textAlign: 'center',
                    letterSpacing: '0.5em',
                  }}
                />
                {otpError && (
                  <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', margin: 0 }}>
                    {otpError}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setShowDecline(true)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12,
                fontSize: 13, fontWeight: 600, color: '#f87171',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <XCircle size={14} /> Decline to sign
            </button>
          </div>

          {/* Legal note */}
          <p style={{ fontSize: 10, color: '#1e293b', textAlign: 'center', lineHeight: 1.5 }}>
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