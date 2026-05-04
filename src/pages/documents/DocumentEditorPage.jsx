import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Draggable from 'react-draggable';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { documentApi } from '@/api/document.api';
import { contactApi } from '@/api/contact.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { SIGNATURE_FIELD } from '@/utils/constants';
import { getInitials, classNames } from '@/utils/helpers';
import {
  ArrowLeft,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  PenLine,
  FileText,
  Layers,
  LayoutGrid,
  Trash2,
  Plus,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DEFAULT_PAGE_W = 794;
const DEFAULT_PAGE_H = 1123;
const PAGE_GAP = 8; // visual gap between pages in the canvas (pixels)
const SCREEN_DPI = 96;
const PDF_POINTS_INCH = 72;

const SIGNER_COLORS = [
  { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', ring: 'ring-indigo-200 dark:ring-indigo-800', dot: 'bg-indigo-600 dark:bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-800' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800', dot: 'bg-emerald-600 dark:bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800', dot: 'bg-purple-600 dark:bg-purple-500', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800', dot: 'bg-orange-600 dark:bg-orange-500', border: 'border-orange-200 dark:border-orange-800' },
  { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', ring: 'ring-sky-200 dark:ring-sky-800', dot: 'bg-sky-600 dark:bg-sky-500', border: 'border-sky-200 dark:border-sky-800' },
  { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-400', ring: 'ring-pink-200 dark:ring-pink-800', dot: 'bg-pink-600 dark:bg-pink-500', border: 'border-pink-200 dark:border-pink-800' },
];

// ─── FieldOverlay ──────────────────────────────────────────────────────────────
function FieldOverlay({ field, pageRelX, pageRelY, pageW, pageH, signerName, signerColor, onRemove, onMoved }) {
  const nodeRef = useRef(null);
  const [pos, setPos] = useState({ x: pageRelX, y: pageRelY });
  const w = field.position?.width ?? field.width ?? SIGNATURE_FIELD.width;
  const h = field.position?.height ?? field.height ?? SIGNATURE_FIELD.height;

  useEffect(() => {
    setPos({ x: pageRelX, y: pageRelY });
  }, [pageRelX, pageRelY]);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={pos}
      bounds="parent"
      onStop={(_, d) => {
        const newX = Math.round(d.x);
        const newY = Math.round(d.y);
        setPos({ x: newX, y: newY });
        onMoved(field.id, newX, newY);
      }}
    >
      <div
        ref={nodeRef}
        className="absolute group cursor-move select-none"
        style={{ width: w, zIndex: 20 }}
      >
        <div
          className={classNames(
            'w-full flex items-center justify-center gap-1.5 text-xs font-black rounded-xl border-2 transition-all shadow-lg hover:scale-105 active:scale-95',
            signerColor.bg, signerColor.text
          )}
          style={{
            height: h,
            borderColor: 'currentColor',
          }}
        >
          <PenLine size={13} className="flex-shrink-0" />
          <span className="truncate max-w-[100px] uppercase tracking-tighter">Sign — P{field.page}</span>
        </div>
        <div className={classNames('text-center truncate px-2 text-[10px] font-black leading-tight mt-1.5 uppercase tracking-wide', signerColor.text)}>
          {signerName}
        </div>
        <button
          onMouseDown={e => { e.stopPropagation(); onRemove(field.id); }}
          className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow-xl z-30 hover:bg-red-600 transition-all hover:scale-110 active:scale-90"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>
    </Draggable>
  );
}

// ─── PageSelector ──────────────────────────────────────────────────────────────
function PageSelector({ signer, signerColor, documentId, totalPages, existingFields, pageW, pageH, onApplied }) {
  const [mode, setMode] = useState('custom');
  const [singlePage, setSinglePage] = useState(1);
  const [customPages, setCustomPages] = useState(new Set([1]));
  const [applying, setApplying] = useState(false);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const existingCount = existingFields.length;

  const toggleCustom = (p) => {
    setCustomPages(prev => {
      const next = new Set(prev);
      if (next.has(p)) { if (next.size > 1) next.delete(p); }
      else next.add(p);
      return next;
    });
  };

  const selectedPages = mode === 'single' ? [singlePage]
    : mode === 'all' ? pages
    : [...customPages].sort((a, b) => a - b);

  const handleApply = async () => {
    if (!selectedPages.length) {
      toast('Please select at least one page.', { icon: 'ℹ️' });
      return;
    }
    setApplying(true);
    try {
      const fieldsToCreate = selectedPages.map(page => {
        const pos_x = Math.round((pageW - SIGNATURE_FIELD.width) / 2);
        const relPosY = pageH - SIGNATURE_FIELD.height - 100;

        return {
          page,
          pos_x,
          pos_y: relPosY,
          width: SIGNATURE_FIELD.width,
          height: SIGNATURE_FIELD.height,
          document_signer_id: signer.id,
          required: true,
        };
      });

      if (fieldsToCreate.length === 1) {
        await documentApi.addField(documentId, fieldsToCreate[0]);
      } else {
        await documentApi.bulkAddFields(documentId, fieldsToCreate);
      }

      toast.success(`${selectedPages.length} field${selectedPages.length > 1 ? 's' : ''} added for ${signer.name}.`);
      onApplied();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to apply fields.');
    } finally {
      setApplying(false);
    }
  };

  const modeTabs = [
    { key: 'single', label: 'Single', icon: FileText },
    { key: 'all', label: 'All pages', icon: Layers },
    { key: 'custom', label: 'Custom', icon: LayoutGrid },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 border-t border-gray-100 dark:border-slate-800">
      <div className="p-5 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Placement Strategy</p>

        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
          {modeTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={classNames(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all',
                mode === key
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              )}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {mode === 'single' && (
          <div className="grid grid-cols-6 gap-1.5">
            {pages.map(p => (
              <button
                key={p} onClick={() => setSinglePage(p)}
                className={classNames(
                  'rounded-lg text-xs font-bold transition-all h-8',
                  singlePage === p
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {mode === 'custom' && (
          <div className="grid grid-cols-6 gap-1.5">
            {pages.map(p => (
              <button
                key={p} onClick={() => toggleCustom(p)}
                className={classNames(
                  'rounded-lg text-xs font-bold transition-all h-8 border-2',
                  customPages.has(p)
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 text-indigo-700 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-100 dark:border-slate-700 hover:border-indigo-200'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={handleApply}
          disabled={applying || selectedPages.length === 0}
          className="w-full rounded-xl shadow-lg shadow-indigo-500/10 py-3"
          size="sm"
        >
          {applying ? <Spinner size="xs" /> : <Plus size={14} />}
          {selectedPages.length === 0 ? 'Select Pages' : `Place ${selectedPages.length} Fields`}
        </Button>
      </div>
    </div>
  );
}

// ─── SignerCard ────────────────────────────────────────────────────────────────
function SignerCard({ signer, signerIndex, signingMode, documentId, totalPages, signerFields, pageW, pageH, onRemove, onApplied }) {
  const color = SIGNER_COLORS[signerIndex % SIGNER_COLORS.length];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={classNames(
      'rounded-2xl overflow-hidden border transition-all duration-300',
      signerFields.length > 0 
        ? 'border-indigo-200 dark:border-indigo-500/30 shadow-md shadow-indigo-500/5' 
        : 'border-gray-200 dark:border-slate-800 shadow-sm'
    )}>
      <div className={classNames('flex items-center gap-3 px-5 py-4', signerFields.length > 0 ? color.bg : 'bg-white dark:bg-slate-900')}>
        <div className={classNames('w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md', color.dot)}>
          {getInitials(signer.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {signingMode === 'sequential' && (
              <span className="text-[10px] font-black bg-white dark:bg-slate-800 text-gray-400 border border-gray-100 dark:border-slate-700 px-1.5 py-0.5 rounded-md shadow-xs">
                #{signer.signing_order}
              </span>
            )}
            <p className={classNames('text-sm font-bold truncate leading-none', signerFields.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white')}>
              {signer.name}
            </p>
          </div>
          <p className="text-[10px] truncate text-gray-500 dark:text-slate-500 mt-1.5 font-medium">{signer.email}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
        >
          <ChevronDown size={14} className={classNames('transition-transform duration-300', expanded && 'rotate-180')} />
        </button>
        <button
          onClick={() => onRemove(signer.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && (
        <PageSelector
          signer={signer}
          signerColor={color}
          documentId={documentId}
          totalPages={totalPages}
          existingFields={signerFields}
          pageW={pageW}
          pageH={pageH}
          onApplied={onApplied}
        />
      )}
    </div>
  );
}

// ─── AddSignerModal ────────────────────────────────────────────────────────────
function AddSignerModal({ open, onClose, documentId, onAdded }) {
  const [tab, setTab] = useState('manual');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: contactsData, isLoading: contactsLoading, isError: contactsError } = useQuery({
    queryKey: ['contacts-picker'],
    queryFn: () => contactApi.list({ per_page: 100 }),
    enabled: open && tab === 'contacts',
  });

  const reset = () => { setName(''); setEmail(''); };

  const add = async (payload) => {
    setSaving(true);
    try {
      await documentApi.addSigner(documentId, payload);
      toast.success(`${payload.name} added.`);
      onAdded(); onClose(); reset();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to add signer.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Add Signer" size="sm">
      <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-6">
        <button
          onClick={() => setTab('manual')}
          className={classNames(
            'flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
            tab === 'manual' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'
          )}
        >
          Manual
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={classNames(
            'flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
            tab === 'contacts' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'
          )}
        >
          Directory
        </button>
      </div>

      {tab === 'manual' ? (
        <div className="space-y-5">
          <Input label="Signer Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Doe" autoFocus />
          <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
          <Button className="w-full rounded-xl py-3" loading={saving} disabled={!name.trim() || !email.trim()} onClick={() => add({ name: name.trim(), email: email.trim() })}>
            <Plus size={14} /> Add Signer
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {contactsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : contactsError ? (
            <p className="text-xs font-bold text-red-500 text-center py-8">Failed to load directory.</p>
          ) : !contactsData?.data?.length ? (
            <div className="text-center py-12">
              <UserPlus size={32} className="mx-auto text-gray-200 dark:text-slate-800 mb-3" />
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500">Your directory is empty</p>
            </div>
          ) : (
            contactsData.data.map(c => (
              <button
                key={c.id}
                onClick={() => add({ name: c.full_name, email: c.email, contact_id: c.id })}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm shadow-sm border border-gray-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{c.full_name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate mt-0.5">{c.email}</p>
                </div>
                <Plus size={14} className="text-gray-300 dark:text-slate-700 group-hover:text-indigo-500" />
              </button>
            ))
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── SendPanel ─────────────────────────────────────────────────────────────────
function SendPanel({ documentId, onSent }) {
  const [result, setResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [sending, setSending] = useState(false);

  const runValidate = async () => {
    setValidating(true);
    try {
      const res = await documentApi.validate(documentId);
      setResult(res.data);
    } catch {
      toast.error('Validation failed.');
    } finally {
      setValidating(false);
    }
  };

  const runSend = async () => {
    setSending(true);
    try {
      await documentApi.send(documentId);
      toast.success('Document sent successfully!');
      onSent();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to send document.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="secondary" className="w-full rounded-xl py-3 border-gray-200 dark:border-slate-800 shadow-sm" loading={validating} onClick={runValidate}>
        <CheckCircle size={16} /> Run Validation
      </Button>
      {result && (
        <div className={classNames(
          'rounded-2xl p-5 border animate-fade-in',
          result.valid 
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-400' 
            : 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 text-red-900 dark:text-red-400'
        )}>
          {result.valid ? (
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-500" />
              <p className="text-xs font-black uppercase tracking-widest leading-none">Ready to Publish</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500" />
                <p className="text-xs font-black uppercase tracking-widest leading-none">Issues Found</p>
              </div>
              <ul className="space-y-1.5 pl-8 list-disc text-[10px] font-bold opacity-80 uppercase tracking-tight">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      <Button size="lg" className="w-full rounded-xl py-4 shadow-xl shadow-indigo-500/20" disabled={!result?.valid} loading={sending} onClick={runSend}>
        <Send size={18} /> Send to Signers
      </Button>
    </div>
  );
}

// ─── helpers ───────────────────────────────────────────────────────────────────
function guessSizeLabel(w, h) {
  const near = (a, b) => Math.abs(a - b) <= 4;
  if (near(w, 794) && near(h, 1123)) return 'A4';
  if (near(w, 559) && near(h, 794)) return 'A5';
  if (near(w, 1123) && near(h, 1587)) return 'A3';
  if (near(w, 816) && near(h, 1056)) return 'Letter';
  if (near(w, 816) && near(h, 1344)) return 'Legal';
  return `${w}×${h}px`;
}

// ─── DocumentEditorPage ────────────────────────────────────────────────────────
export default function DocumentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [signerModal, setSignerModal] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [pageW, setPageW] = useState(DEFAULT_PAGE_W);
  const [pageH, setPageH] = useState(DEFAULT_PAGE_H);
  const [pageSizeLabel, setPageSizeLabel] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentApi.get(id),
  });

  const doc = data?.data?.document;

  useEffect(() => {
    if (!isLoading && doc && !doc.is_editable)
      navigate(`/dashboard/documents/${id}`, { replace: true });
  }, [isLoading, doc, id, navigate]);

  const onDocumentLoadSuccess = useCallback(async (pdfProxy) => {
    const { numPages } = pdfProxy;
    setTotalPages(numPages);

    try {
      const page = await pdfProxy.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const scale = SCREEN_DPI / PDF_POINTS_INCH;

      const detectedW = Math.round(viewport.width * scale);
      const detectedH = Math.round(viewport.height * scale);

      setPageW(detectedW);
      setPageH(detectedH);
      setPageSizeLabel(guessSizeLabel(detectedW, detectedH));
    } catch (e) {
      console.warn('Could not detect PDF page size:', e);
    }
  }, []);

  const handleFieldMoved = useCallback(async (fieldId, pageRelX, pageRelY, pageIdx) => {
    const page = pageIdx + 1;

    try {
      await documentApi.updateField(id, fieldId, { 
        pos_x: pageRelX, 
        pos_y: pageRelY,
        page
      });
      refetch();
    } catch {
      toast.error('Failed to save position.');
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
      refetch();
      toast.success('Signer removed.');
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to remove signer.');
    }
  }, [id, refetch]);

  if (isLoading) return <div className="flex flex-col items-center justify-center h-screen gap-4 dark:bg-slate-950"><Spinner size="lg" /><p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">Launching Editor...</p></div>;
  if (!doc) return <div className="flex items-center justify-center h-screen dark:bg-slate-950 text-gray-500 font-bold uppercase tracking-widest">Document not found.</div>;

  const signers = doc.signers || [];
  const fields = doc.fields || [];
  const fieldsBySigner = signers.reduce((acc, s) => {
    acc[s.id] = fields.filter(f => f.document_signer_id === s.id);
    return acc;
  }, {});

  const pdfUrl = doc.file?.pdf_url ?? doc.file?.original_url;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-sm z-20">
        <div className="px-8 py-8 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-slate-900 dark:to-slate-800/50">
          <button onClick={() => navigate(`/dashboard/documents/${id}`)} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mb-6 uppercase tracking-widest group">
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to details
          </button>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white truncate leading-none tracking-tight" title={doc.title}>{doc.title}</h1>
          <div className="flex items-center gap-3 mt-4">
            <Badge variant="indigo" size="xs" className="font-black uppercase tracking-tighter shadow-sm">{doc.signing_mode}</Badge>
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{doc.status_label}</span>
          </div>
        </div>

        <div className="px-8 py-4 flex items-center gap-3 border-b border-gray-50 dark:border-slate-800/50 bg-gray-50/20 dark:bg-slate-900/50">
          <FileText size={14} className="text-gray-400 dark:text-slate-600" />
          <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
            {totalPages} Pages · {pageSizeLabel}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-100 dark:scrollbar-thumb-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-600">Assign Signers</p>
            <button onClick={() => setSignerModal(true)} className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all">
              <UserPlus size={14} /> Add Signer
            </button>
          </div>

          {signers.length === 0 ? (
            <div className="py-12 px-6 text-center bg-gray-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-800">
              <UserPlus size={32} className="mx-auto mb-4 text-gray-200 dark:text-slate-800" />
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 max-w-[140px] mx-auto">Add at least one signer to start placing fields</p>
              <Button size="sm" variant="secondary" className="mt-6 rounded-xl" onClick={() => setSignerModal(true)}>Add Signer</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {signers.map((signer, i) => (
                <SignerCard key={signer.id} signer={signer} signerIndex={i} signingMode={doc.signing_mode} documentId={id} totalPages={totalPages} signerFields={fieldsBySigner[signer.id] || []} pageW={pageW} pageH={pageH} onRemove={handleRemoveSigner} onApplied={refetch} />
              ))}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <SendPanel documentId={id} onSent={() => { queryClient.invalidateQueries(['documents']); navigate(`/dashboard/documents/${id}`); }} />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex justify-center py-12 px-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
        <div style={{ width: pageW }} className="animate-fade-in relative z-10">
          <div className="flex items-center justify-between px-8 py-4 rounded-3xl mb-10 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <p className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest">DRAG FIELDS TO REPOSITION · CLICK SIGNERS TO ASSIGN</p>
            {fields.length > 0 && <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">{fields.length} Field{fields.length > 1 ? 's' : ''} Placed</span>}
          </div>

          <div className="relative group">
            {pdfUrl ? (
              <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800" style={{ height: pageH }}><Spinner size="lg" /><p className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest animate-pulse">Rendering PDF...</p></div>}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <div key={i} className="relative mb-4 group/page">
                    <div className="shadow-2xl shadow-slate-300/50 dark:shadow-none transition-shadow duration-500 group-hover/page:shadow-indigo-500/10">
                      <Page pageNumber={i + 1} width={pageW} renderAnnotationLayer={false} renderTextLayer={false} className="rounded-xl overflow-hidden" />
                    </div>
                    {/* Field overlays for this page */}
                    {fields.filter(f => Number(f.page) === i + 1).map(field => {
                      const signerIdx = signers.findIndex(s => s.id === field.document_signer_id);
                      const color = SIGNER_COLORS[Math.max(0, signerIdx) % SIGNER_COLORS.length];
                      const signer = signers[signerIdx];
                      const absX = field.pos_x ?? 0;
                      const pageRelY = field.pos_y ?? 0;

                      return (
                        <div key={field.id} className="absolute inset-0 pointer-events-none z-30">
                          <div style={{ pointerEvents: 'auto', position: 'relative', width: '100%', height: '100%' }}>
                            <FieldOverlay field={field} pageRelX={absX} pageRelY={pageRelY} pageW={pageW} pageH={pageH} signerName={signer?.name ?? 'Signer'} signerColor={color} onRemove={handleRemoveField} onMoved={(fId, x, y) => handleFieldMoved(fId, x, y, i)} />
                          </div>
                        </div>
                      );
                    })}
                    {i < totalPages - 1 && (
                      <div className="absolute left-0 right-0 h-[8px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center pointer-events-none" style={{ top: pageH }}>
                        <span className="text-[8px] font-black text-gray-400 dark:text-slate-600 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-full uppercase">Page {i + 2}</span>
                      </div>
                    )}
                  </div>
                ))}
              </Document>
            ) : (
              <div className="flex items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800" style={{ height: pageH }}>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Document Preview Available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 0.4px, transparent 0.4px)', backgroundSize: '40px 40px', opacity: 0.05 }} />
      </div>

      <AddSignerModal open={signerModal} onClose={() => setSignerModal(false)} documentId={id} onAdded={refetch} />
    </div>
  );
}
