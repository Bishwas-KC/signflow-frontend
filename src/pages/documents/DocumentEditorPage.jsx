import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Draggable from 'react-draggable';
import { documentApi } from '@/api/document.api';
import { contactApi }  from '@/api/contact.api';
import { Button }  from '@/components/ui/Button';
import { Modal }   from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Badge }   from '@/components/ui/Badge';
import { FIELD_TYPES, SIGN_ROLES } from '@/utils/constants';
import { getInitials } from '@/utils/helpers';
import {
  ArrowLeft, Send, UserPlus, CheckCircle,
  AlertCircle, X, ChevronRight, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────────────────
   Google Fonts injection (Instrument Serif + DM Sans)
───────────────────────────────────────────────────────────────────────────── */
const FontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
    rel="stylesheet"
  />
);

/* ─────────────────────────────────────────────────────────────────────────────
   Design Tokens  (injected once at root)
───────────────────────────────────────────────────────────────────────────── */
const GlobalStyle = () => (
  <style>{`
    :root {
      --sidebar-bg:   #0f1117;
      --sidebar-border: #1e2130;
      --sidebar-muted: #3a3f52;
      --panel-bg:     #161924;
      --accent:       #7c6ef5;
      --accent-glow:  rgba(124,110,245,0.18);
      --accent-light: rgba(124,110,245,0.10);
      --canvas-bg:    #f0ede8;
      --text-primary: #f4f3f0;
      --text-secondary: #8b8fa8;
      --text-muted:   #4a4f65;
      --danger:       #f87171;
      --success:      #34d399;
      --warning:      #fbbf24;
      --font-display: 'Instrument Serif', Georgia, serif;
      --font-body:    'DM Sans', system-ui, sans-serif;
      --radius:       12px;
      --radius-sm:    8px;
    }
    .de-page * { font-family: var(--font-body); box-sizing: border-box; }
    .de-page { background: var(--sidebar-bg); }

    .de-sidebar-scroll::-webkit-scrollbar { width: 4px; }
    .de-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
    .de-sidebar-scroll::-webkit-scrollbar-thumb { background: var(--sidebar-muted); border-radius: 4px; }

    .de-field-btn {
      position: relative; overflow: hidden;
      transition: all 0.2s ease;
    }
    .de-field-btn::before {
      content: '';
      position: absolute; inset: 0;
      background: var(--accent-light);
      opacity: 0; transition: opacity 0.2s;
      border-radius: var(--radius-sm);
    }
    .de-field-btn:hover::before { opacity: 1; }
    .de-field-btn.active::before { opacity: 1; background: var(--accent-glow); }

    .de-signer-card {
      transition: all 0.18s ease;
      cursor: pointer;
    }
    .de-signer-card:hover { transform: translateX(2px); }
    .de-signer-card.active { background: var(--accent-light); border-color: var(--accent) !important; }

    .de-send-btn {
      background: linear-gradient(135deg, #7c6ef5 0%, #5a4fcf 100%);
      box-shadow: 0 4px 20px rgba(124,110,245,0.35);
      transition: all 0.2s ease;
    }
    .de-send-btn:hover:not(:disabled) {
      box-shadow: 0 6px 28px rgba(124,110,245,0.5);
      transform: translateY(-1px);
    }
    .de-send-btn:disabled { opacity: 0.4; box-shadow: none; transform: none; }

    .de-validate-btn {
      background: transparent;
      border: 1px solid var(--sidebar-muted);
      transition: all 0.2s ease;
    }
    .de-validate-btn:hover { border-color: var(--accent); color: var(--accent); }

    .de-canvas-grid {
      background-color: var(--canvas-bg);
      background-image:
        radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    .de-field-overlay {
      transition: box-shadow 0.15s ease, transform 0.15s ease;
    }
    .de-field-overlay:hover { transform: scale(1.02); }

    .de-modal-overlay {
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
    }

    .de-tab-pill {
      transition: all 0.2s ease;
    }
    .de-contact-row {
      transition: all 0.18s ease;
    }
    .de-contact-row:hover { transform: translateX(3px); }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .de-animate-up { animation: slideUp 0.3s ease forwards; }

    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(124,110,245,0.4); }
      70%  { box-shadow: 0 0 0 8px rgba(124,110,245,0); }
      100% { box-shadow: 0 0 0 0 rgba(124,110,245,0); }
    }
    .de-pulse { animation: pulse-ring 2s infinite; }

    .de-placement-hint {
      animation: slideUp 0.25s ease;
      background: linear-gradient(135deg, #7c6ef5, #5a4fcf);
      box-shadow: 0 8px 32px rgba(124,110,245,0.5);
    }
  `}</style>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Section Header
───────────────────────────────────────────────────────────────────────────── */
function SectionLabel({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {children}
      </span>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Divider
───────────────────────────────────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: 1, background: 'var(--sidebar-border)', margin: '4px -20px' }} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Avatar
───────────────────────────────────────────────────────────────────────────── */
function Avatar({ name, color, size = 30 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff',
      fontSize: size * 0.32,
      fontWeight: 700,
      flexShrink: 0,
      letterSpacing: '0.02em',
      boxShadow: `0 2px 8px ${color}55`,
    }}>
      {getInitials(name)}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Draggable Field Overlay
───────────────────────────────────────────────────────────────────────────── */
function FieldOverlay({ field, signer, onRemove, onMoved }) {
  const fieldType = FIELD_TYPES.find(f => f.value === field.field_type);
  const color = fieldType?.color || '#7c6ef5';
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: field.position.x, y: field.position.y }}
      bounds="parent"
      onStop={(_, d) => onMoved(field.id, d.x, d.y)}
    >
      <div
        ref={nodeRef}
        className="absolute group de-field-overlay"
        style={{
          width: field.position.width,
          height: field.position.height,
          zIndex: 20,
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: '100%', height: '100%',
          borderRadius: 6,
          border: `2px solid ${color}`,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 4,
          color,
          fontSize: 11,
          fontWeight: 600,
          boxShadow: `0 2px 10px ${color}30`,
        }}>
          <span style={{ fontSize: 13 }}>{fieldType?.icon}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
            {fieldType?.label}
          </span>
        </div>

        {signer && (
          <div style={{
            position: 'absolute', top: -8, right: -8,
            width: 18, height: 18,
            borderRadius: '50%',
            background: color,
            border: '2px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
            fontSize: 7,
            fontWeight: 800,
            boxShadow: `0 2px 6px ${color}60`,
          }} title={signer.name}>
            {getInitials(signer.name)}
          </div>
        )}

        <button
          onMouseDown={e => { e.stopPropagation(); onRemove(field.id); }}
          className="absolute group-hover:flex hidden items-center justify-center"
          style={{
            top: -8, left: -8,
            width: 18, height: 18,
            borderRadius: '50%',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
            zIndex: 30,
          }}
        >
          <X size={9} />
        </button>
      </div>
    </Draggable>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Add Signer Modal
───────────────────────────────────────────────────────────────────────────── */
function AddSignerModal({ open, onClose, documentId, onAdded }) {
  const [tab, setTab]         = useState('manual');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [role, setRole]       = useState('signer');
  const [loading, setLoading] = useState(false);

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-picker'],
    queryFn:  () => contactApi.list({ per_page: 100 }),
    enabled:  open && tab === 'contacts',
  });

  const reset = () => { setName(''); setEmail(''); setRole('signer'); };

  const addSigner = async (signerData) => {
    setLoading(true);
    try {
      await documentApi.addSigner(documentId, signerData);
      toast.success(`${signerData.name} added as ${signerData.sign_role}.`);
      onAdded();
      onClose();
      reset();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to add signer.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="">
      <style>{`
        .de-modal-input {
          width: 100%;
          background: #0f1117;
          border: 1px solid #1e2130;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: var(--font-body);
          color: #f4f3f0;
          outline: none;
          transition: border-color 0.2s;
        }
        .de-modal-input::placeholder { color: #4a4f65; }
        .de-modal-input:focus { border-color: #7c6ef5; box-shadow: 0 0 0 3px rgba(124,110,245,0.12); }
      `}</style>

      <div style={{ padding: '4px 0' }}>
        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 400,
            color: '#f4f3f0',
            marginBottom: 4,
          }}>
            Add Signer
          </h2>
          <p style={{ fontSize: 12, color: '#8b8fa8' }}>
            Who needs to sign or review this document?
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4,
          background: '#0a0c12',
          borderRadius: 10, padding: 4,
          marginBottom: 20,
          border: '1px solid #1e2130',
        }}>
          {[
            { id: 'manual', label: 'Add Manually' },
            { id: 'contacts', label: 'From Contacts' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="de-tab-pill"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                background: tab === t.id ? '#1e2130' : 'transparent',
                color: tab === t.id ? '#f4f3f0' : '#4a4f65',
                boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'manual' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#8b8fa8', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <input
                className="de-modal-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name"
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#8b8fa8', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <input
                className="de-modal-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@123company.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#8b8fa8', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Role
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {SIGN_ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    style={{
                      padding: '9px 8px',
                      borderRadius: 9,
                      border: `1.5px solid ${role === r.value ? '#7c6ef5' : '#1e2130'}`,
                      background: role === r.value ? 'rgba(124,110,245,0.12)' : 'transparent',
                      color: role === r.value ? '#a89af9' : '#4a4f65',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => addSigner({ name: name.trim(), email: email.trim(), sign_role: role })}
              disabled={!name.trim() || !email.trim() || loading}
              style={{
                marginTop: 4,
                padding: '11px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #7c6ef5 0%, #5a4fcf 100%)',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: !name.trim() || !email.trim() || loading ? 'not-allowed' : 'pointer',
                opacity: !name.trim() || !email.trim() ? 0.45 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(124,110,245,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <><UserPlus size={14} /> Add Signer</>
              )}
            </button>
          </div>
        ) : (
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {!contactsData?.data?.length ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#4a4f65', fontSize: 13 }}>
                No contacts found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(contactsData.data).map(c => (
                  <div
                    key={c.id}
                    className="de-contact-row"
                    onClick={() => addSigner({ name: c.full_name, email: c.email, sign_role: c.sign_role, contact_id: c.id })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #1e2130',
                      background: '#0a0c12',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7c6ef5, #5a4fcf)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 11, fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {c.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#f4f3f0', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.full_name}
                      </p>
                      <p style={{ fontSize: 11, color: '#4a4f65', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.email}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                      padding: '3px 8px', borderRadius: 20,
                      background: 'rgba(124,110,245,0.12)', color: '#a89af9',
                      border: '1px solid rgba(124,110,245,0.2)',
                    }}>
                      {c.role_label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Send Panel
───────────────────────────────────────────────────────────────────────────── */
function SendPanel({ documentId, isSendable, onSent }) {
  const [result, setResult]         = useState(null);
  const [validating, setValidating] = useState(false);
  const [sending, setSending]       = useState(false);

  const runValidate = async () => {
    setValidating(true);
    try {
      const res = await documentApi.validate(documentId);
      setResult(res.data);
    } catch {
      toast.error('Validation request failed.');
    } finally {
      setValidating(false);
    }
  };

  const runSend = async () => {
    setSending(true);
    try {
      await documentApi.send(documentId);
      toast.success('Document sent to all signers!');
      onSent();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        className="de-validate-btn"
        onClick={runValidate}
        disabled={validating}
        style={{
          width: '100%', padding: '9px 16px',
          borderRadius: 9, cursor: 'pointer',
          fontSize: 12, fontWeight: 600,
          fontFamily: 'var(--font-body)',
          color: '#8b8fa8',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'all 0.2s',
        }}
      >
        {validating ? (
          <div style={{ width: 13, height: 13, border: '1.5px solid rgba(139,143,168,0.3)', borderTopColor: '#8b8fa8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <><CheckCircle size={13} /> Validate Document</>
        )}
      </button>

      {result && (
        <div
          className="de-animate-up"
          style={{
            borderRadius: 10, padding: '10px 12px',
            background: result.valid ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${result.valid ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
          }}
        >
          {result.valid ? (
            <p style={{ fontSize: 12, color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={13} /> Ready to send
            </p>
          ) : (
            <div>
              <p style={{ fontSize: 12, color: '#f87171', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <AlertCircle size={13} /> Fix these issues
              </p>
              <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {result.errors.map((e, i) => (
                  <li key={i} style={{ fontSize: 11, color: '#f87171', opacity: 0.85 }}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        className="de-send-btn"
        onClick={runSend}
        disabled={!result?.valid || sending}
        style={{
          width: '100%', padding: '11px 16px',
          borderRadius: 10, border: 'none',
          cursor: !result?.valid || sending ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--font-body)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {sending ? (
          <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <><Send size={13} /> Send to Signers</>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────────────── */
export default function DocumentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);

  const [signerModal, setSignerModal]       = useState(false);
  const [activeSigner, setActiveSigner]     = useState(null);
  const [activeFieldType, setActiveFieldType] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['document', id],
    queryFn:  () => documentApi.get(id),
  });

  const doc = data?.data?.document;

  if (!isLoading && doc && !doc.is_editable) {
    navigate(`/dashboard/documents/${id}`, { replace: true });
    return null;
  }

  const handleCanvasClick = useCallback(async (e) => {
    if (!activeFieldType || !canvasRef.current) return;
    const rect   = canvasRef.current.getBoundingClientRect();
    const config = FIELD_TYPES.find(f => f.value === activeFieldType);
    const posX   = Math.max(0, Math.round(e.clientX - rect.left - config.w / 2));
    const posY   = Math.max(0, Math.round(e.clientY - rect.top  - config.h / 2));
    try {
      await documentApi.addField(id, {
        field_type:         activeFieldType,
        page:               1,
        pos_x:              posX,
        pos_y:              posY,
        width:              config.w,
        height:             config.h,
        document_signer_id: activeFieldType === 'company_seal' ? null : (activeSigner?.id || null),
        required:           true,
      });
      refetch();
      toast.success(`${config.label} placed.`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to place field.');
    }
  }, [activeFieldType, activeSigner, id, refetch]);

  const handleFieldMoved = useCallback(async (fieldId, x, y) => {
    try {
      await documentApi.updateField(id, fieldId, { pos_x: Math.round(x), pos_y: Math.round(y) });
      refetch();
    } catch {
      toast.error('Failed to save field position.');
    }
  }, [id, refetch]);

  const handleRemoveField = useCallback(async (fieldId) => {
    try {
      await documentApi.removeField(id, fieldId);
      refetch();
      toast.success('Field removed.');
    } catch {
      toast.error('Failed to remove field.');
    }
  }, [id, refetch]);

  const handleRemoveSigner = useCallback(async (signerId) => {
    try {
      await documentApi.removeSigner(id, signerId);
      if (activeSigner?.id === signerId) setActiveSigner(null);
      refetch();
      toast.success('Signer removed.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to remove signer.');
    }
  }, [id, activeSigner, refetch]);

  const signerPalette = ['#7c6ef5','#06b6d4','#10b981','#f59e0b','#ec4899','#f97316'];
  const isPlacing = !!activeFieldType;

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #1e2130', borderTopColor: '#7c6ef5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!doc) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117', color: '#4a4f65', fontSize: 14 }}>
      Document not found.
    </div>
  );

  return (
    <div className="de-page" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <FontLink />
      <GlobalStyle />

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: 280,
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--sidebar-border)' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 500, color: '#4a4f65',
              background: 'none', border: 'none', cursor: 'pointer',
              marginBottom: 14, padding: 0,
              transition: 'color 0.15s',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#8b8fa8'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a4f65'}
          >
            <ArrowLeft size={12} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              borderRadius: 9,
              background: 'linear-gradient(135deg, rgba(124,110,245,0.2), rgba(90,79,207,0.1))',
              border: '1px solid rgba(124,110,245,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Zap size={16} color="#7c6ef5" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 400,
                color: 'var(--text-primary)',
                marginBottom: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }} title={doc.title}>
                {doc.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: '#4a4f65',
                }}>
                  {doc.signing_mode}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#4a4f65' }} />
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: '#7c6ef5',
                }}>
                  {doc.status_label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="de-sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

          {/* ── Field Palette ──────────────────────────────────────────── */}
          <section style={{ marginBottom: 24 }}>
            <SectionLabel>Fields</SectionLabel>
            <p style={{ fontSize: 11, color: '#4a4f65', marginBottom: 12, lineHeight: 1.5 }}>
              Select a field type, then click on the document to place it.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {FIELD_TYPES.map(ft => {
                const isActive = activeFieldType === ft.value;
                return (
                  <button
                    key={ft.value}
                    className={`de-field-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveFieldType(prev => prev === ft.value ? null : ft.value)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px',
                      borderRadius: 9,
                      border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--sidebar-border)'}`,
                      background: isActive ? 'rgba(124,110,245,0.1)' : 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: `${ft.color}18`,
                      border: `1px solid ${ft.color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, flexShrink: 0,
                    }}>
                      {ft.icon}
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: isActive ? '#c4b8ff' : '#8b8fa8',
                      flex: 1,
                    }}>
                      {ft.label}
                    </span>
                    {isActive && (
                      <span style={{ fontSize: 10, color: '#7c6ef5', fontWeight: 600 }}>
                        Click →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Context chip */}
            {activeSigner && activeFieldType && (
              <div className="de-animate-up" style={{
                marginTop: 10, padding: '8px 12px',
                borderRadius: 9,
                background: 'rgba(124,110,245,0.08)',
                border: '1px solid rgba(124,110,245,0.2)',
              }}>
                <p style={{ fontSize: 11, color: '#a89af9', fontWeight: 500 }}>
                  Assigning to: <strong style={{ color: '#c4b8ff' }}>{activeSigner.name}</strong>
                </p>
              </div>
            )}
            {!activeSigner && activeFieldType && activeFieldType !== 'company_seal' && (
              <div className="de-animate-up" style={{
                marginTop: 10, padding: '8px 12px',
                borderRadius: 9,
                background: 'rgba(251,191,36,0.07)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}>
                <p style={{ fontSize: 11, color: '#fbbf24', fontWeight: 500 }}>
                  Select a signer below to assign this field.
                </p>
              </div>
            )}
          </section>

          <Divider />

          {/* ── Signers ────────────────────────────────────────────────── */}
          <section style={{ marginTop: 20, marginBottom: 24 }}>
            <SectionLabel
              action={
                <button
                  onClick={() => setSignerModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 600, color: '#7c6ef5',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a89af9'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7c6ef5'}
                >
                  <UserPlus size={11} /> Add
                </button>
              }
            >
              Signers
            </SectionLabel>

            {(doc.signers || []).length === 0 ? (
              <button
                onClick={() => setSignerModal(true)}
                style={{
                  width: '100%',
                  padding: '20px 16px',
                  borderRadius: 10,
                  border: '1.5px dashed var(--sidebar-border)',
                  background: 'transparent',
                  color: '#4a4f65',
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c6ef5'; e.currentTarget.style.color = '#7c6ef5'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sidebar-border)'; e.currentTarget.style.color = '#4a4f65'; }}
              >
                <UserPlus size={20} />
                <span>Add first signer</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(doc.signers || []).map((s, i) => {
                  const isActive = activeSigner?.id === s.id;
                  const color = signerPalette[i % signerPalette.length];
                  return (
                    <div
                      key={s.id}
                      className={`de-signer-card ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveSigner(prev => prev?.id === s.id ? null : s)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 10px 10px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${isActive ? color + '60' : 'var(--sidebar-border)'}`,
                        background: isActive ? `${color}0d` : 'var(--panel-bg)',
                      }}
                    >
                      <Avatar name={s.name} color={color} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>
                          {s.name}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {s.sign_role}
                        </p>
                      </div>
                      {doc.signing_mode === 'sequential' && s.signing_order && (
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#1e2130',
                          color: '#8b8fa8',
                          fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {s.signing_order}
                        </div>
                      )}
                      <button
                        onMouseDown={e => { e.stopPropagation(); handleRemoveSigner(s.id); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#3a3f52', padding: 3, borderRadius: 5,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'color 0.15s',
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color = '#3a3f52'}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Send Panel (sticky footer) ──────────────────────────────── */}
        <div style={{
          padding: '16px 20px 20px',
          borderTop: '1px solid var(--sidebar-border)',
          background: 'var(--sidebar-bg)',
        }}>
          <SendPanel
            documentId={id}
            isSendable={doc.is_sendable}
            onSent={() => {
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              navigate(`/dashboard/documents/${id}`);
            }}
          />
        </div>
      </aside>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <main
        className="de-canvas-grid"
        style={{
          flex: 1,
          overflowAuto: 'auto',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          padding: 48,
          cursor: isPlacing ? 'crosshair' : 'default',
        }}
      >
        <div
          ref={canvasRef}
          style={{
            position: 'relative',
            width: 794,
            minHeight: 1123,
            background: 'white',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.12)',
            borderRadius: 3,
          }}
          onClick={handleCanvasClick}
        >
          {/* PDF preview */}
          <iframe
            src={`${doc.file?.original_url}#toolbar=0&navpanes=0&scrollbar=0`}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              border: 'none', pointerEvents: 'none',
              borderRadius: 3,
            }}
            title="Document Preview"
          />

          {/* Click-capture layer */}
          {isPlacing && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              cursor: 'crosshair',
              background: 'rgba(124,110,245,0.03)',
              borderRadius: 3,
            }} />
          )}

          {/* Field overlays */}
          {(doc.fields || []).map(field => {
            const signer = (doc.signers || []).find(s => s.id === field.document_signer_id);
            return (
              <FieldOverlay
                key={field.id}
                field={field}
                signer={signer}
                onRemove={handleRemoveField}
                onMoved={handleFieldMoved}
              />
            );
          })}

          {/* Placement hint */}
          {isPlacing && (
            <div
              className="de-placement-hint"
              style={{
                position: 'absolute', bottom: 20,
                left: '50%', transform: 'translateX(-50%)',
                color: 'white', fontSize: 12, fontWeight: 600,
                padding: '9px 20px', borderRadius: 100,
                pointerEvents: 'none', zIndex: 30,
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.02em',
              }}
            >
              Click to place {FIELD_TYPES.find(f => f.value === activeFieldType)?.label} · Esc to cancel
            </div>
          )}
        </div>
      </main>

      {/* Keyboard: Esc to cancel */}
      <div
        tabIndex={-1}
        onKeyDown={e => { if (e.key === 'Escape') setActiveFieldType(null); }}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />

      <AddSignerModal
        open={signerModal}
        onClose={() => setSignerModal(false)}
        documentId={id}
        onAdded={refetch}
      />
    </div>
  );
}