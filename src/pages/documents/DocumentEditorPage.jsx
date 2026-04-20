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
  AlertCircle, X, Trash2, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Draggable Field on Canvas ─────────────────────────────────────────────────
function FieldOverlay({ field, signer, documentId, onRemove, onMoved }) {
  const fieldType = FIELD_TYPES.find(f => f.value === field.field_type);
  const color = fieldType?.color || '#6366f1';
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
        className="absolute group cursor-move select-none"
        style={{ width: field.position.width, height: field.position.height, zIndex: 20 }}
      >
        <div
          className="w-full h-full rounded border-2 flex items-center justify-center text-xs font-medium gap-1"
          style={{ borderColor: color, background: `${color}22`, color }}
        >
          <span>{fieldType?.icon}</span>
          <span className="truncate px-1">{fieldType?.label}</span>
        </div>

        {/* Signer indicator */}
        {signer && (
          <div
            className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold border-2 border-white"
            style={{ background: color, fontSize: 8 }}
            title={signer.name}
          >
            {getInitials(signer.name)}
          </div>
        )}

        {/* Remove button */}
        <button
          onMouseDown={e => { e.stopPropagation(); onRemove(field.id); }}
          className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow-sm z-30"
        >
          <X size={10} />
        </button>
      </div>
    </Draggable>
  );
}

// ── Add Signer Modal ──────────────────────────────────────────────────────────
function AddSignerModal({ open, onClose, documentId, onAdded }) {
  const [tab, setTab]       = useState('manual');
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [role, setRole]     = useState('signer');
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

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Add Signer">
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
        {['manual', 'contacts'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'manual' ? 'Add Manually' : 'From Contacts'}
          </button>
        ))}
      </div>

      {tab === 'manual' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Jane Doe" autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email Address *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {SIGN_ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                    role === r.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            className="w-full" loading={loading}
            disabled={!name.trim() || !email.trim()}
            onClick={() => addSigner({ name: name.trim(), email: email.trim(), sign_role: role })}
          >
            Add Signer
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {!contactsData?.data?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No contacts found.</p>
          ) : (contactsData.data).map(c => (
            <div key={c.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all"
              onClick={() => addSigner({ name: c.full_name, email: c.email, sign_role: c.sign_role, contact_id: c.id })}
            >
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{c.email}</p>
              </div>
              <Badge className={SIGN_ROLES.find(r => r.value === c.sign_role)?.color || ''}>
                {c.role_label}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ── Validate & Send ───────────────────────────────────────────────────────────
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
    <div className="space-y-3 pt-2">
      <Button variant="secondary" size="sm" className="w-full" loading={validating} onClick={runValidate}>
        <CheckCircle size={14} />Validate
      </Button>

      {result && (
        <div className={`rounded-xl p-3 text-xs ${result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.valid ? (
            <p className="text-green-800 font-medium flex items-center gap-1.5">
              <CheckCircle size={13} />Ready to send!
            </p>
          ) : (
            <div>
              <p className="text-red-800 font-medium mb-1.5 flex items-center gap-1.5">
                <AlertCircle size={13} />Fix these issues:
              </p>
              <ul className="space-y-0.5 pl-3 list-disc text-red-700">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <Button size="sm" className="w-full" disabled={!result?.valid} loading={sending} onClick={runSend}>
        <Send size={14} />Send to Signers
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);

  const [signerModal, setSignerModal] = useState(false);
  const [activeSigner, setActiveSigner]   = useState(null);
  const [activeFieldType, setActiveFieldType] = useState(null); // currently selected palette item

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['document', id],
    queryFn:  () => documentApi.get(id),
  });

  const doc = data?.data?.document;

  // ── Redirect if not editable ──────────────────────────────────────────────
  if (!isLoading && doc && !doc.is_editable) {
    navigate(`/dashboard/documents/${id}`, { replace: true });
    return null;
  }

  // ── Click on canvas to place selected field ───────────────────────────────
  const handleCanvasClick = useCallback(async (e) => {
    if (!activeFieldType || !canvasRef.current) return;

    const rect   = canvasRef.current.getBoundingClientRect();
    const config = FIELD_TYPES.find(f => f.value === activeFieldType);
    const posX   = Math.max(0, Math.round(e.clientX - rect.left - config.w / 2));
    const posY   = Math.max(0, Math.round(e.clientY - rect.top  - config.h / 2));

    try {
      await documentApi.addField(id, {
        field_type:          activeFieldType,
        page:                1,
        pos_x:               posX,
        pos_y:               posY,
        width:               config.w,
        height:              config.h,
        document_signer_id:  activeFieldType === 'company_seal' ? null : (activeSigner?.id || null),
        required:            true,
      });
      refetch();
      toast.success(`${config.label} field placed.`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to place field.');
    }
  }, [activeFieldType, activeSigner, id, refetch]);

  // ── Update field position after drag ─────────────────────────────────────
  const handleFieldMoved = useCallback(async (fieldId, x, y) => {
    try {
      await documentApi.updateField(id, fieldId, { pos_x: Math.round(x), pos_y: Math.round(y) });
      refetch();
    } catch {
      toast.error('Failed to save field position.');
    }
  }, [id, refetch]);

  // ── Remove field ──────────────────────────────────────────────────────────
  const handleRemoveField = useCallback(async (fieldId) => {
    try {
      await documentApi.removeField(id, fieldId);
      refetch();
      toast.success('Field removed.');
    } catch {
      toast.error('Failed to remove field.');
    }
  }, [id, refetch]);

  // ── Remove signer ─────────────────────────────────────────────────────────
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

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>
  );
  if (!doc) return (
    <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Document not found.</p></div>
  );

  const signerColors = ['#4f46e5','#0891b2','#059669','#d97706','#7c3aed','#db2777'];
  const isPlacing = !!activeFieldType;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2 transition-colors">
            <ArrowLeft size={14} />Back
          </button>
          <h2 className="font-semibold text-gray-900 text-sm truncate" title={doc.title}>
            {doc.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {doc.signing_mode} · {doc.status_label}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

          {/* ── Field Palette ──────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Fields
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Select a field type, then click anywhere on the document to place it.
            </p>
            <div className="space-y-1.5">
              {FIELD_TYPES.map(ft => (
                <button key={ft.value}
                  onClick={() => setActiveFieldType(prev => prev === ft.value ? null : ft.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all text-sm text-left ${
                    activeFieldType === ft.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium'
                      : 'border-dashed border-gray-200 hover:border-indigo-300 text-gray-700'
                  }`}
                >
                  <span style={{ color: ft.color, fontSize: 16 }}>{ft.icon}</span>
                  {ft.label}
                  {activeFieldType === ft.value && (
                    <span className="ml-auto text-xs text-indigo-500">Click doc →</span>
                  )}
                </button>
              ))}
            </div>
            {activeSigner && activeFieldType && (
              <div className="mt-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-200">
                <p className="text-xs text-indigo-700">
                  Assigning to: <span className="font-semibold">{activeSigner.name}</span>
                </p>
              </div>
            )}
            {!activeSigner && activeFieldType && activeFieldType !== 'company_seal' && (
              <div className="mt-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700">
                  Select a signer below to assign this field, or place unassigned.
                </p>
              </div>
            )}
          </div>

          {/* ── Signers ────────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signers</p>
              <button onClick={() => setSignerModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors">
                <UserPlus size={12} />Add
              </button>
            </div>

            {(doc.signers || []).length === 0 ? (
              <button onClick={() => setSignerModal(true)}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors">
                + Add first signer
              </button>
            ) : (
              <div className="space-y-2">
                {(doc.signers || []).map((s, i) => (
                  <div key={s.id}
                    onClick={() => setActiveSigner(prev => prev?.id === s.id ? null : s)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      activeSigner?.id === s.id
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-200 bg-white'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: signerColors[i % signerColors.length] }}
                    >
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{s.sign_role}</p>
                    </div>
                    {doc.signing_mode === 'sequential' && s.signing_order && (
                      <span className="text-xs bg-gray-100 text-gray-500 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-mono">
                        {s.signing_order}
                      </span>
                    )}
                    <button
                      onMouseDown={e => { e.stopPropagation(); handleRemoveSigner(s.id); }}
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Send Panel ──────────────────────────────────────────────────── */}
          <div className="border-t border-gray-100 -mx-4 px-4 pt-4">
            <SendPanel
              documentId={id}
              isSendable={doc.is_sendable}
              onSent={() => {
                queryClient.invalidateQueries({ queryKey: ['documents'] });
                navigate(`/dashboard/documents/${id}`);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Canvas Area ───────────────────────────────────────────────────── */}
      <div
        className={`flex-1 overflow-auto bg-gray-200 flex justify-center p-8 ${isPlacing ? 'cursor-crosshair' : ''}`}
        style={{ backgroundImage: 'radial-gradient(circle, #9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        <div
          ref={canvasRef}
          className="relative bg-white shadow-2xl"
          style={{ width: 794, minHeight: 1123 }}
          onClick={handleCanvasClick}
        >
          {/* PDF preview */}
          <iframe
            src={`${doc.file?.original_url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="absolute inset-0 w-full h-full border-none pointer-events-none"
            title="Document Preview"
          />

          {/* Transparent click-capture layer */}
          {isPlacing && (
            <div className="absolute inset-0 z-10"
              style={{ cursor: 'crosshair', background: 'rgba(79,70,229,0.03)' }}
            />
          )}

          {/* Field overlays */}
          {(doc.fields || []).map(field => {
            const signer = (doc.signers || []).find(s => s.id === field.document_signer_id);
            return (
              <FieldOverlay
                key={field.id}
                field={field}
                signer={signer}
                documentId={id}
                onRemove={handleRemoveField}
                onMoved={handleFieldMoved}
              />
            );
          })}

          {/* Placement hint */}
          {isPlacing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none z-30">
              Click anywhere to place {FIELD_TYPES.find(f => f.value === activeFieldType)?.label} · Press Esc to cancel
            </div>
          )}
        </div>
      </div>

      {/* Esc to deselect field type */}
      <div
        tabIndex={-1}
        onKeyDown={e => { if (e.key === 'Escape') setActiveFieldType(null); }}
        className="sr-only"
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