// src/pages/sign/SigningAuthPage.jsx
// The page signers land on when they're not yet logged in.
// Shows document context + login / register / Google tabs.
// The email field is pre-filled from the signing token and LOCKED —
// the user cannot change it, enforcing that they log in as the invited email.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { signApi } from '@/api/sign.api';
import api from '@/api/axios';
import {
  Lock, Mail, Eye, EyeOff, User, ArrowRight,
  FileText, ShieldCheck, AlertTriangle, Chrome,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────
function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  const masked = '*'.repeat(Math.max(2, local.length - 2));
  return `${visible}${masked}@${domain}`;
}

function storeAuth(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

// ── InputField ────────────────────────────────────────────────────────────────
function InputField({ label, type = 'text', value, onChange, placeholder, disabled, readOnly, icon: Icon, rightSlot, autoFocus }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: readOnly ? '#334155' : '#475569', pointerEvents: 'none',
          }}>
            <Icon size={14} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: `10px ${rightSlot ? '40px' : '12px'} 10px ${Icon ? '36px' : '12px'}`,
            background: readOnly ? '#0a1628' : '#1e293b',
            border: `1px solid ${readOnly ? '#1e293b' : '#334155'}`,
            borderRadius: 10, fontSize: 13, color: readOnly ? '#475569' : '#e2e8f0',
            outline: 'none', fontFamily: 'inherit',
            cursor: readOnly ? 'not-allowed' : 'text',
          }}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

// ── LoginForm ─────────────────────────────────────────────────────────────────
function LoginForm({ signerEmail, onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) { toast.error('Please enter your password.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: signerEmail, password }).then(r => r.data);
      storeAuth(res.data);
      toast.success('Logged in successfully!');
      onSuccess(res.data.user);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <InputField
        label="Email address"
        type="email"
        value={signerEmail}
        readOnly
        icon={Mail}
        rightSlot={<Lock size={12} style={{ color: '#334155' }} />}
      />
      <InputField
        label="Password"
        type={showPw ? 'text' : 'password'}
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Enter your password"
        icon={Lock}
        autoFocus
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !password}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 10,
          fontSize: 14, fontWeight: 700, color: 'white',
          background: loading || !password
            ? '#1e293b'
            : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          border: 'none', cursor: loading || !password ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', marginTop: 4,
          boxShadow: loading || !password ? 'none' : '0 0 24px rgba(99,102,241,0.4)',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'Signing in…' : 'Sign in & Continue'}
      </button>
    </div>
  );
}

// ── RegisterForm ──────────────────────────────────────────────────────────────
function RegisterForm({ signerEmail, signerName, onSuccess }) {
  const [name, setName] = useState(signerName || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Please enter your full name.'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: signerEmail,
        password,
        password_confirmation: confirm,
      }).then(r => r.data);
      storeAuth(res.data);
      toast.success('Account created! Welcome to Signflow.');
      onSuccess(res.data.user);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.email?.[0];
      toast.error(msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <InputField
        label="Full name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your full name"
        icon={User}
        autoFocus
      />
      <InputField
        label="Email address"
        type="email"
        value={signerEmail}
        readOnly
        icon={Mail}
        rightSlot={<Lock size={12} style={{ color: '#334155' }} />}
      />
      <InputField
        label="Password"
        type={showPw ? 'text' : 'password'}
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Min. 8 characters"
        icon={Lock}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
      />
      <InputField
        label="Confirm password"
        type={showPw ? 'text' : 'password'}
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder="Repeat password"
        icon={Lock}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !name || !password || !confirm}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 10,
          fontSize: 14, fontWeight: 700, color: 'white',
          background: loading ? '#1e293b' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', marginTop: 4,
          boxShadow: '0 0 24px rgba(99,102,241,0.35)',
        }}
      >
        {loading ? 'Creating account…' : 'Create account & Continue'}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SigningAuthPage() {
  const { token }   = useParams();
  const navigate     = useNavigate();

  const [signingData, setSigningData] = useState(null);
  const [loadError,   setLoadError]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('login'); // 'login' | 'register' | 'google'
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Load signing context ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await signApi.getSigningData(token);
        const data = res.data;
        setSigningData(data);

        // If signer has already signed/declined, redirect accordingly
        if (data.signer.status === 'signed') {
          navigate(`/sign/${token}/complete`, { replace: true });
          return;
        }
        if (data.signer.status === 'declined') {
          setLoadError('This signing invitation has already been declined.');
          return;
        }
      } catch (err) {
        const msg = err?.response?.data?.message;
        setLoadError(msg || 'Invalid or expired signing link.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // ── After successful auth ─────────────────────────────────────────────────
  const handleAuthSuccess = (user) => {
    const signerEmail = signingData?.signer?.email;
    if (signerEmail && user.email.toLowerCase() !== signerEmail.toLowerCase()) {
      toast.error(
        `You signed in as ${user.email}, but this document is for ${signerEmail}. Please sign in with the correct account.`,
        { duration: 6000 }
      );
      // Clear the wrong auth
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return;
    }
    navigate(`/sign/${token}`, { replace: true });
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const res = await api.get('/auth/google/redirect').then(r => r.data);
      // Open Google OAuth in same tab; callback will handle auth
      window.location.href = res.data.redirect_url;
    } catch {
      toast.error('Could not initiate Google sign-in. Please try email login.');
      setGoogleLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060d1a',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid #1e293b', borderTopColor: '#6366f1',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: '#334155', fontSize: 13 }}>Loading invitation…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (loadError) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060d1a', padding: 24,
    }}>
      <div style={{
        maxWidth: 400, textAlign: 'center',
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: 20, padding: 40,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <AlertTriangle size={24} style={{ color: '#ef4444' }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          Link Not Valid
        </h2>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{loadError}</p>
      </div>
    </div>
  );

  const { signer, document: doc } = signingData;
  const maskedEmail = maskEmail(signer.email);

  const tabs = [
    { key: 'login',    label: 'Log in' },
    { key: 'register', label: 'Sign up' },
    { key: 'google',   label: 'Google' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#060d1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            marginBottom: 20,
          }}>
            <ShieldCheck size={14} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.05em' }}>
              SIGNFLOW · SECURE E-SIGNATURE
            </span>
          </div>
        </div>

        {/* Document context card */}
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 16, padding: '20px 24px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FileText size={20} style={{ color: '#6366f1' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                You've been invited to sign
              </p>
              <h2 style={{
                fontSize: 16, fontWeight: 700, color: '#e2e8f0',
                margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {doc.title}
              </h2>
              {doc.company && (
                <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                  from {doc.company.name}
                </p>
              )}
            </div>
          </div>

          {/* Signer identity banner */}
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <User size={14} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc', margin: 0 }}>
                {signer.name}
              </p>
              <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
                {maskedEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Auth card */}
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 20, overflow: 'hidden',
        }}>
          {/* Title */}
          <div style={{ padding: '24px 28px 0' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' }}>
              Sign in to continue
            </h3>
            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
              You must sign in as <strong style={{ color: '#94a3b8' }}>{maskedEmail}</strong> to access this document.
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', padding: '20px 28px 0', gap: 4,
            borderBottom: '1px solid #1e293b', marginTop: 20,
          }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 16px', borderRadius: '8px 8px 0 0',
                  fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                  color: tab === t.key ? '#a5b4fc' : '#475569',
                  background: tab === t.key ? 'rgba(99,102,241,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: tab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 28 }}>
            {tab === 'login' && (
              <LoginForm
                signerEmail={signer.email}
                onSuccess={handleAuthSuccess}
              />
            )}

            {tab === 'register' && (
              <RegisterForm
                signerEmail={signer.email}
                signerName={signer.name}
                onSuccess={handleAuthSuccess}
              />
            )}

            {tab === 'google' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Warning */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                }}>
                  <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: '#d97706', lineHeight: 1.6, margin: 0 }}>
                    Your Google account email must match{' '}
                    <strong style={{ color: '#f59e0b' }}>{maskedEmail}</strong>.
                    If it doesn't, you won't be able to sign this document.
                  </p>
                </div>

                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 10,
                    fontSize: 14, fontWeight: 600, color: '#e2e8f0',
                    background: '#1e293b', border: '1px solid #334155',
                    cursor: googleLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 10, transition: 'all 0.15s',
                  }}
                >
                  {/* Google G icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {googleLoading ? 'Redirecting…' : 'Continue with Google'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#1e293b', marginTop: 24 }}>
          Secured by Signflow · Your data is encrypted in transit
        </p>
      </div>
    </div>
  );
}