import { useCallback, useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Pen, RotateCcw, Mail, KeyRound, ArrowLeft } from 'lucide-react';

export function SignDocumentModal({ open, onClose, onSign, onVerifyOtp, signLoading, verifyLoading, step, signer, documentTitle }) {
  const sigRef = useRef(null);
  const otpRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (open) {
      setHasContent(false);
      setOtp('');
      setTimeout(() => sigRef.current?.clear(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (step === 'otp' && otpRef.current) {
      otpRef.current.focus();
    }
  }, [step]);

  const handleDrawEnd = useCallback(() => {
    setHasContent(!sigRef.current?.isEmpty());
  }, []);

  const handleClear = () => {
    sigRef.current?.clear();
    setHasContent(false);
  };

  const handleSign = () => {
    if (!hasContent) return;
    const dataUri = sigRef.current.toDataURL('image/png');
    onSign(dataUri);
  };

  const handleVerify = () => {
    if (otp.length !== 6) return;
    onVerifyOtp(otp);
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
  };

  const handleOtpKeyDown = (e) => {
    if (e.key === 'Enter' && otp.length === 6) {
      handleVerify();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={step === 'otp' ? 'Enter OTP Code' : 'Sign Document'} size="lg">
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Pen size={14} className="text-indigo-500" />
            <span className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
              Signing as
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{signer?.name}</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{signer?.email}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 italic">
            &ldquo;{documentTitle}&rdquo;
          </p>
        </div>

        {step === 'draw' && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                  Draw your signature
                </span>
                <Button size="xs" variant="ghost" onClick={handleClear}>
                  <RotateCcw size={12} /> Clear
                </Button>
              </div>
              <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <SignatureCanvas
                  ref={sigRef}
                  penColor="#4f46e5"
                  minWidth={1.5}
                  maxWidth={3}
                  canvasProps={{
                    className: 'w-full h-48 cursor-crosshair',
                  }}
                  onEnd={handleDrawEnd}
                />
              </div>
              {!hasContent && (
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium text-center">
                  Draw your signature above using your mouse or touch
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1 rounded-xl py-3" onClick={onClose} disabled={signLoading}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1 rounded-xl py-3 shadow-lg shadow-indigo-500/20"
                onClick={handleSign} loading={signLoading} disabled={!hasContent}>
                <Mail size={16} /> Send OTP
              </Button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800/50 rounded-xl flex items-center justify-center mx-auto">
                <Mail size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                OTP sent to {signer?.email}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Please check your email for the one-time passcode
              </p>
            </div>

            <div className="space-y-3">
              <span className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest text-center">
                Enter 6-digit OTP
              </span>
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={handleOtpChange}
                onKeyDown={handleOtpKeyDown}
                placeholder="000000"
                className="w-48 mx-auto block text-center text-3xl font-black tracking-[0.3em] bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 outline-none transition-colors"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1 rounded-xl py-3" onClick={onClose} disabled={verifyLoading}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1 rounded-xl py-3 shadow-lg shadow-indigo-500/20"
                onClick={handleVerify} loading={verifyLoading} disabled={otp.length !== 6}>
                <KeyRound size={16} /> Verify &amp; Sign
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
