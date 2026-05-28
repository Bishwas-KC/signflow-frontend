import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { signApi } from '@/api/sign.api';
import { getCurrentUser } from '@/utils/helpers';
import { SCREEN_DPI, PDF_PTS } from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Bookmark, PenLine, Type, CheckCircle, AlertTriangle,
  LogOut, XCircle, User, FileText, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DrawTab, TypeTab, UploadTab } from '@/components/shared/SignatureTabs';

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
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
  const [savedSignatures, setSavedSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [emailMismatch, setEmailMismatch] = useState(false);

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [pageW, setPageW] = useState(794);
  const [pageH, setPageH] = useState(1123);
  const [pdfError, setPdfError] = useState(false);
  const [scale, setScale] = useState(1);
  const pdfContainerRef = useRef(null);

  const [sigTab, setSigTab] = useState('upload');
  const [signatureData, setSignatureData] = useState(null);
  const [saveToAccount, setSaveToAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDecline, setShowDecline] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resending, setResending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpKey, setOtpKey] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);

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
          signApi.getSavedSignatures(),
        ]);

        if (sigRes.status === 'fulfilled') {
          const data = sigRes.value.data;
          setSigningData(data);

          const currentUser = getCurrentUser();
          if (currentUser?.email && data.signer?.email?.toLowerCase() !== currentUser.email.toLowerCase()) {
            setEmailMismatch(true);
          }

          if (data.signer?.status === 'signed') {
            navigate(`/sign/${token}/thank-you?doc_id=${data?.document?.id}`, { replace: true });
            return;
          }
        } else {
          setLoadError(sigRes.reason?.response?.data?.message || 'Invalid signing link.');
        }

        if (savedRes.status === 'fulfilled') {
          const sigs = savedRes.value.data;
          if (Array.isArray(sigs)) {
            setSavedSignatures(sigs);
          }
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

  // OTP countdown timer
  useEffect(() => {
    if (!otpSent) { setOtpCountdown(0); return; }
    setOtpCountdown(60);
    const interval = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpKey]);

  const recalcScale = useCallback(() => {
    if (pdfContainerRef.current && pageW > 0) {
      const available = pdfContainerRef.current.clientWidth;
      setScale(Math.min(1, available / pageW));
    }
  }, [pageW]);

  const onPdfLoad = useCallback(async (pdfProxy) => {
    setTotalPages(pdfProxy.numPages);
    try {
      const page = await pdfProxy.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const pdfScale = SCREEN_DPI / PDF_PTS;
      const newW = Math.round(viewport.width * pdfScale);
      const newH = Math.round(viewport.height * pdfScale);
      setPageW(newW);
      setPageH(newH);
    } catch {}
  }, []);

  useEffect(() => {
    recalcScale();
  }, [pageW, recalcScale]);

  useEffect(() => {
    const onResize = () => recalcScale();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [recalcScale]);

  const fieldsByPage = useMemo(() => {
    if (!signingData?.fields) return {};
    return signingData.fields.reduce((acc, f) => {
      const page = f.page ?? 'unknown';
      if (!acc[page]) acc[page] = [];
      acc[page].push(f);
      return acc;
    }, {});
  }, [signingData]);

  const handleSign = async () => {
    if (!signatureData) { toast.error('Please create your signature first.'); return; }
    setSubmitting(true);
    try {
      if (saveToAccount) {
        const res = await signApi.saveNewSignature(signatureData).catch(() => {});
        if (res?.data) {
          setSavedSignatures(prev => [{ ...res.data, data_uri: res.data.data_uri || signatureData }, ...prev]);
        }
      }
      await signApi.submit(token, signatureData);
      setOtpSent(true);
      setOtpKey(k => k + 1);
      toast.success('OTP sent to your email. Please check your inbox.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit signature.', {
        duration: 6000,
        id: 'signer-mismatch',
      });
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
      setOtpVerified(true);
      toast.success('Document signed successfully.');
      navigate(`/sign/${token}/thank-you?doc_id=${signingData?.document?.id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid or expired OTP.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!signatureData) return;
    setResending(true);
    setOtpError('');
    setOtp('');
    try {
      await signApi.submit(token, signatureData);
      setOtpSent(true);
      setOtpKey(k => k + 1);
      toast.success('OTP resent to your email.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const handleDecline = async (reason) => {
    setDeclining(true);
    try {
      await signApi.decline(token, reason);
      toast.success('You have declined this document.');
      navigate(`/sign/${token}/thank-you?declined=1&doc_id=${signingData?.document?.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to decline.');
    } finally {
      setDeclining(false);
      setShowDecline(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`/sign/${token}`, { replace: true });
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

  if (!signingData) return null;
  const { signer = {}, document: doc } = signingData;
  if (!doc) return null;

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
    { key: 'upload', label: 'Saved Signature', icon: Bookmark },
    { key: 'draw', label: 'Draw', icon: PenLine },
    { key: 'type', label: 'Type', icon: Type },
  ];

  return (
    <div className="min-h-screen min-h-dynamic flex flex-col bg-gray-50">
<div className="flex-1 p-4 sm:p-5 lg:p-8 pt-3 lg:pt-4 grid grid-cols-1 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_minmax(380px,480px)] gap-4 sm:gap-6 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid-rows-1">        {/* ── PDF Preview ── */}
<div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0 h-[75vh] md:h-[85vh] lg:h-[calc(100vh-48px)]">            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-gray-900 truncate">{doc.title}</h2>
                {doc.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FileText size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {signingData.total_fields} field{signingData.total_fields > 1 ? 's' : ''} on {(signingData.pages_to_sign || []).length} page{(signingData.pages_to_sign || []).length > 1 ? 's' : ''}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(signingData.pages_to_sign || []).map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                      P{p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
<div ref={pdfContainerRef} className="flex-1 overflow-y-auto bg-gray-50/50 py-4 min-h-0">            {pdfBlobUrl ? (
              <div className="flex justify-center">
                <div className="relative" style={{ width: pageW * scale, maxWidth: '100%' }}>
                  <Document
                    file={pdfBlobUrl}
                    onLoadSuccess={onPdfLoad}
                    loading={null}
                  >
                    {Array.from({ length: totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      const pageFields = fieldsByPage[pageNum] || [];

                      return (
                          <div key={i} className={`relative ${i < totalPages - 1 ? 'mb-4' : ''}`}>
                            <div className="shadow-lg">
                              <Page
                                pageNumber={pageNum}
                                width={pageW * scale}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                className="bg-white rounded-lg overflow-hidden"
                              />
                            </div>
                          {pageFields.map(field => {
                            return (
                              <div
                                key={field.id}
                                className={`absolute border-2 rounded-md transition-all cursor-default z-10 overflow-hidden ${
                                  otpVerified ? 'border-emerald-400 bg-emerald-50/20' : 'border-amber-400 bg-amber-50/20'
                                }`}
                                style={{
                                  left: (field.position?.x ?? 0) * scale,
                                  top: (field.position?.y ?? 0) * scale,
                                  width: (field.position?.width ?? 200) * scale,
                                  height: (field.position?.height ?? 120) * scale,
                                }}
                              >
                                  {signatureData ? (
                                  <div className="flex flex-col items-start h-full p-1">
                                    <img
                                      src={signatureData}
                                      alt="signature"
                                      className="self-start max-w-full max-h-[70%] object-contain object-left flex-shrink-0"
                                    />
                                    {otpVerified ? (
                                      <div className="text-left leading-tight flex-shrink-0">
                                        <p className="text-xs font-bold text-emerald-700">Signed by {signer.name}</p>
                                        <p className="text-[11px] text-gray-500 truncate max-w-full">{signer.email}</p>
                                        <p className="text-[11px] text-gray-400">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                      </div>
                                    ) : (
                                      <div className="text-left leading-tight flex-shrink-0">
                                        <p className="text-xs font-bold text-amber-600">Signing as {signer.name}</p>
                                        <p className="text-[11px] text-gray-500 truncate max-w-full">{signer.email}</p>
                                        <p className="text-[11px] text-gray-400">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                      <PenLine size={14} className="text-amber-500 mx-auto" />
                                        <p className="text-xs text-amber-600 mt-0.5 font-bold">SIGN HERE</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {/* Page separator */}
                          {i < totalPages - 1 && (
                            <div className="flex items-center justify-center py-2">
                              <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                Page {pageNum + 1}
                              </span>
                            </div>
                          )}
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

        {/* ── Signing Panel ── */}
 <div className="flex flex-col gap-3 lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto">
          {/* Sent by + Signer Info */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            {doc.owner && (
              <div className="flex items-center gap-3 p-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sent by</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{doc.owner.name}</p>
                  <p className="text-xs text-gray-500 truncate">{doc.owner.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-indigo-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signing as</p>
                <p className="text-sm font-bold text-gray-900 truncate">{signer.name}</p>
                <p className="text-xs text-gray-500 truncate">{signer.email}</p>
              </div>
              <Badge size="xs" className="bg-indigo-50 text-indigo-600 border-indigo-200 font-bold">
                Signer
              </Badge>
            </div>
          </div>

          {/* Signature Creation */}
          <div className={`bg-white border transition-all rounded-2xl shadow-sm ${
            signatureData ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-200'
          }`}>
            {/* Tabs */}
            <div role="tablist" className="flex gap-1 p-1 bg-gray-100/80">
              {sigTabs.map(t => {
                const Icon = t.icon;
                const active = sigTab === t.key;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => { setSigTab(t.key); setSignatureData(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-inherit min-h-[44px] sm:min-h-0 ${
                      active
                        ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Icon size={13} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div role="tabpanel" className="p-3 min-h-[200px] md:min-h-[300px]">
              {sigTab === 'draw' && <DrawTab onSignatureReady={setSignatureData} saveToAccount={saveToAccount} setSaveToAccount={setSaveToAccount} signatureData={signatureData} />}
              {sigTab === 'type' && <TypeTab signerName={signer.name} onSignatureReady={setSignatureData} saveToAccount={saveToAccount} setSaveToAccount={setSaveToAccount} signatureData={signatureData} />}
              {sigTab === 'upload' && <UploadTab savedSignatures={savedSignatures} onSignatureReady={setSignatureData} saveToAccount={saveToAccount} setSaveToAccount={setSaveToAccount} signatureData={signatureData} />}
            </div>
          </div>

          {/* OTP + Actions */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 space-y-2">
            {otpSent && (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 text-center">
                  OTP sent to <strong className="text-gray-700">{signingData?.signer?.email}</strong>
                </p>
                <input
                  type="text"
                  id="otp-input"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter OTP"
                  maxLength={6}
                  aria-label="One-time password"
                  className={`w-full px-4 py-2.5 rounded-xl text-lg font-bold text-center tracking-[0.5em] bg-white border ${
                    otpError ? 'border-red-300' : 'border-gray-200'
                  } text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-inherit box-border`}
                />
                {otpError && (
                  <p className="text-xs text-red-500 text-center">{otpError}</p>
                )}
                <button
                  onClick={handleVerify}
                  disabled={verifying || !otp}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer font-inherit flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying…' : 'Verify OTP'}
                </button>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400">
                    {otpCountdown > 0
                      ? `OTP expires in ${otpCountdown}s`
                      : 'OTP expired'}
                  </span>
                  <button
                    onClick={handleResendOtp}
                    disabled={resending || otpCountdown > 50}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer font-inherit min-h-[44px]"
                  >
                    {resending ? 'Resending…' : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            {!otpSent && (
              <button
                onClick={handleSign}
                disabled={submitting || !signatureData}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-inherit ${
                  submitting || !signatureData
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                }`}
              >
                <CheckCircle size={16} />
                {submitting ? 'Signing…' : 'Sign Document'}
              </button>
            )}

            <button
              onClick={() => setShowDecline(true)}
              disabled={submitting || verifying}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all cursor-pointer font-inherit flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle size={14} /> Decline to sign
            </button>

            <p className="text-xs text-gray-500 text-center leading-relaxed">
              By clicking "Sign Document" you agree that your electronic signature is legally binding.
              Powered by Signflow.
            </p>
          </div>
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
