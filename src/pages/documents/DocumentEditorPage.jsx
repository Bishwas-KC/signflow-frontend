// src/pages/documents/DocumentEditorPage.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { getInitials } from '@/utils/helpers';
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
  { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200', dot: 'bg-indigo-600', border: 'border-indigo-200' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-600', border: 'border-emerald-200' },
  { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200', dot: 'bg-purple-600', border: 'border-purple-200' },
  { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', dot: 'bg-orange-600', border: 'border-orange-200' },
  { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', dot: 'bg-sky-600', border: 'border-sky-200' },
  { bg: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-200', dot: 'bg-pink-600', border: 'border-pink-200' },
];

// ─── FieldOverlay ──────────────────────────────────────────────────────────────
// Renders a draggable signature field placeholder on the PDF canvas.
// `pageRelX` / `pageRelY` are coordinates relative to the top-left of the
// page div this overlay is contained in — NOT absolute canvas coordinates.
function FieldOverlay({ field, pageRelX, pageRelY, pageW, pageH, signerName, signerColor, onRemove, onMoved }) {
  const nodeRef = useRef(null);
  const [pos, setPos] = useState({ x: pageRelX, y: pageRelY });
  const w = field.position?.width ?? field.width ?? SIGNATURE_FIELD.width;
  const h = field.position?.height ?? field.height ?? SIGNATURE_FIELD.height;

  // Keep local position in sync when the stored value changes (e.g. after refetch)
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
        // Pass page-relative coordinates; handleFieldMoved converts to absolute canvas Y
        onMoved(field.id, newX, newY);
      }}
    >
      <div
        ref={nodeRef}
        className="absolute group cursor-move select-none"
        style={{ width: w, zIndex: 20 }}
      >
        <div
          className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border-2 transition-all shadow-sm hover:shadow-md ${signerColor.bg} ${signerColor.text}`}
          style={{
            height: h,
            borderColor: signerColor.dot.replace('bg-', '#').replace('600', '500'),
          }}
        >
          <PenLine size={13} className="flex-shrink-0" />
          <span className="truncate max-w-[100px]">Sign — P{field.page}</span>
        </div>
        <div className={`text-center truncate px-1 ${signerColor.text} text-[10px] font-semibold leading-tight mt-1`}>
          {signerName}
        </div>
        <button
          onMouseDown={e => { e.stopPropagation(); onRemove(field.id); }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow-md z-30 hover:bg-red-600 transition-all hover:scale-110"
        >
          <X size={10} />
        </button>
      </div>
    </Draggable>
  );
}

// ─── PageSelector ──────────────────────────────────────────────────────────────
// Lets the user pick which pages to add a signature field to for a given signer.
// Supports single-page, all-pages, and custom multi-page selection.
// Users can click "Add fields" multiple times to place additional fields on the
// same page(s).
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
        // Centre the field horizontally on the page
        const pos_x = Math.round((pageW - SIGNATURE_FIELD.width) / 2);
        // Relative Y: place field near the bottom of the page
        const relPosY = pageH - SIGNATURE_FIELD.height - 100;
        // Absolute canvas Y: sum of all previous pages' heights + gaps
        const pos_y = (page - 1) * (pageH + PAGE_GAP) + relPosY;

        return {
          page,
          pos_x,
          pos_y,
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
    <div className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
      <div className="p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Assign to pages</p>

        <div className="flex gap-1.5">
          {modeTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === key
                  ? `${signerColor.dot} text-white shadow-md`
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {mode === 'single' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-medium">Select a page</p>
            <div className="flex flex-wrap gap-1.5">
              {pages.map(p => {
                const sel = singlePage === p;
                return (
                  <button
                    key={p}
                    onClick={() => setSinglePage(p)}
                    className={`rounded-lg text-xs font-semibold transition-all ${
                      sel
                        ? `${signerColor.dot} text-white shadow-md`
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                    style={{ width: 32, height: 32 }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === 'all' && (
          <div className={`flex items-center gap-3 p-3 rounded-xl ${signerColor.bg} ring-1 ${signerColor.ring}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${signerColor.dot}`}>
              <CheckCircle size={14} className="text-white" />
            </div>
            <div className="flex-1">
              <p className={`text-xs font-semibold ${signerColor.text}`}>Add to all pages</p>
              <p className={`text-xs text-gray-600 mt-0.5`}>
                {totalPages} field{totalPages > 1 ? 's' : ''} will be added
              </p>
            </div>
          </div>
        )}

        {mode === 'custom' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-medium">Select pages</p>
            <div className="flex flex-wrap gap-1.5">
              {pages.map(p => {
                const sel = customPages.has(p);
                return (
                  <button
                    key={p}
                    onClick={() => toggleCustom(p)}
                    className={`rounded-lg text-xs font-semibold transition-all ${
                      sel
                        ? `${signerColor.bg} ${signerColor.text} ring-1 ${signerColor.ring} border-2 ${signerColor.border}`
                        : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                    }`}
                    style={{ width: 32, height: 32 }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            {customPages.size > 0 && (
              <p className={`text-xs font-medium ${signerColor.text}`}>
                {customPages.size} page{customPages.size > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

        <div className="pt-2 space-y-2">
          <button
            onClick={handleApply}
            disabled={applying || selectedPages.length === 0}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              applying || selectedPages.length === 0
                ? `bg-gray-200 text-gray-400 cursor-not-allowed`
                : `${signerColor.dot} text-white shadow-md hover:shadow-lg hover:scale-[1.02]`
            }`}
          >
            {applying ? (
              <>
                <Spinner size="sm" />
                Assigning…
              </>
            ) : (
              <>
                <Plus size={14} />
                {selectedPages.length === 0
                  ? 'Select pages'
                  : `Add ${selectedPages.length} field${selectedPages.length > 1 ? 's' : ''}`}
              </>
            )}
          </button>

          {existingCount > 0 && (
            <div className={`flex items-center gap-2 p-2.5 rounded-lg ${signerColor.bg} border border-gray-200`}>
              <CheckCircle size={12} className={signerColor.dot.replace('bg-', 'text-')} />
              <span className={`text-xs font-semibold ${signerColor.text}`}>
                {existingCount} field{existingCount > 1 ? 's' : ''} placed
              </span>
              <span className={`text-xs ${signerColor.text} opacity-60 ml-auto`}>
                Click above to add more
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SignerCard ────────────────────────────────────────────────────────────────
function SignerCard({ signer, signerIndex, signingMode, documentId, totalPages, signerFields, pageW, pageH, onRemove, onApplied }) {
  const color = SIGNER_COLORS[signerIndex % SIGNER_COLORS.length];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl overflow-hidden ring-1 transition-all ${
      signerFields.length > 0 ? `${color.ring} shadow-sm` : 'border-gray-200 shadow-xs'
    }`}>
      <div className={`flex items-center gap-3 px-4 py-3.5 ${signerFields.length > 0 ? color.bg : 'bg-white'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color.dot} text-white shadow-sm`}>
          {getInitials(signer.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {signingMode === 'sequential' && signer.signing_order && (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${color.dot} text-[9px] shadow-sm`}>
                {signer.signing_order}
              </span>
            )}
            <p className={`text-sm font-semibold truncate ${signerFields.length > 0 ? color.text : 'text-gray-900'}`}>
              {signer.name}
            </p>
          </div>
          <p className={`text-xs truncate ${signerFields.length > 0 ? color.text + ' opacity-70' : 'text-gray-500'}`}>
            {signer.email}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            expanded ? `${color.bg} ${color.text}` : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={() => onRemove(signer.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
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
      <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
        <button
          onClick={() => setTab('manual')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Enter manually
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'contacts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          From contacts
        </button>
      </div>

      {tab === 'manual' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full name *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Doe"
              autoFocus
              className="focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email address *</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button className="w-full py-2.5 font-semibold" loading={saving}
            disabled={!name.trim() || !email.trim()}
            onClick={() => add({ name: name.trim(), email: email.trim() })}
          >
            <Plus size={14} /> Add Signer
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {contactsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : contactsError ? (
            <p className="text-sm text-red-500 text-center py-8">Failed to load contacts.</p>
          ) : !contactsData?.data?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No contacts found.</p>
          ) : (
            contactsData.data.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all hover:shadow-sm"
                onClick={() => add({ name: c.full_name, email: c.email, contact_id: c.id })}
              >
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                </div>
                <Plus size={14} className="text-gray-300" />
              </div>
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
      toast.success('Document sent!');
      onSent();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button variant="secondary" size="sm" className="w-full py-2.5 font-semibold" loading={validating} onClick={runValidate}>
        <CheckCircle size={14} /> Validate document
      </Button>
      {result && (
        <div
          className={`rounded-xl p-3.5 text-xs font-medium ${
            result.valid
              ? 'bg-green-50 text-green-800 ring-1 ring-green-200'
              : 'bg-red-50 text-red-800 ring-1 ring-red-200'
          }`}
        >
          {result.valid ? (
            <p className="flex items-center gap-2"><CheckCircle size={14} /> Ready to send!</p>
          ) : (
            <div>
              <p className="mb-2 flex items-center gap-2"><AlertCircle size={14} /> Issues found:</p>
              <ul className="space-y-1 pl-6 list-disc">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      <Button size="sm" className="w-full py-2.5 font-semibold" disabled={!result?.valid} loading={sending} onClick={runSend}>
        <Send size={14} /> Send to signers
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
  if (near(w, 1123) && near(h, 794)) return 'A4 Landscape';
  if (near(w, 794) && near(h, 559)) return 'A5 Landscape';
  if (near(w, 1056) && near(h, 816)) return 'Letter Landscape';
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
      const scale = SCREEN_DPI / PDF_POINTS_INCH; // 96/72 — converts PDF pts → screen px

      const detectedW = Math.round(viewport.width * scale);
      const detectedH = Math.round(viewport.height * scale);

      setPageW(detectedW);
      setPageH(detectedH);
      setPageSizeLabel(guessSizeLabel(detectedW, detectedH));
    } catch (e) {
      console.warn('Could not detect PDF page size:', e);
    }
  }, []);

  // ✅ FIX (Bug 2): When a field is dragged, onMoved delivers page-relative X/Y.
  // We must convert back to an absolute canvas Y by adding the cumulative offset
  // for all preceding pages INCLUDING the PAGE_GAP between them.
  //
  // Wrong:  absoluteY = (page - 1) * pageH        + pageRelY
  // Correct: absoluteY = (page - 1) * (pageH + PAGE_GAP) + pageRelY
  const handleFieldMoved = useCallback(async (fieldId, pageRelX, pageRelY, pageIdx) => {
    const page = pageIdx + 1;
    // Absolute canvas Y: sum of all previous pages' heights + gaps
    const absoluteY = (page - 1) * (pageH + PAGE_GAP) + pageRelY;

    try {
      await documentApi.updateField(id, fieldId, { pos_x: pageRelX, pos_y: absoluteY });
      refetch();
    } catch {
      toast.error('Failed to save position.');
    }
  }, [id, refetch, pageH]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
            <Spinner size="lg" />
          </div>
          <p className="text-sm font-medium text-gray-600">Loading editor…</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-gray-400" />
          <p className="text-gray-600 font-medium">Document not found.</p>
        </div>
      </div>
    );
  }

  const signers = doc.signers || [];
  const fields = doc.fields || [];

  const fieldsBySigner = signers.reduce((acc, s) => {
    acc[s.id] = fields.filter(f => f.document_signer_id === s.id);
    return acc;
  }, {});

  const pdfUrl = doc.file?.pdf_url ?? doc.file?.original_url;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden bg-white border-r border-gray-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Back to documents
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate mb-2" title={doc.title}>
            {doc.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="indigo" size="sm" className="capitalize font-semibold">
              {doc.signing_mode}
            </Badge>
            <span className="text-xs font-medium text-gray-500">{doc.status_label}</span>
            {fields.length > 0 && (
              <Badge variant="emerald" size="sm" className="ml-auto font-semibold">
                {fields.length} field{fields.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* PDF info */}
        <div className="px-6 py-3 flex items-center gap-2 border-b border-gray-100 bg-gray-50">
          <FileText size={14} className="text-indigo-600 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700">
            {totalPages > 1
              ? `${totalPages} pages detected`
              : pdfUrl ? 'Loading PDF…' : 'No PDF found'}
          </span>
          {pageSizeLabel && (
            <Badge variant="gray" size="sm" className="ml-auto font-semibold">
              {pageSizeLabel}
            </Badge>
          )}
        </div>

        {/* Signers list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Signers</p>
            <Button variant="ghost" size="sm" onClick={() => setSignerModal(true)} className="hover:bg-indigo-50">
              <UserPlus size={13} /> Add
            </Button>
          </div>

          {signers.length === 0 ? (
            <Button
              variant="outline"
              className="w-full py-8 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all font-semibold"
              onClick={() => setSignerModal(true)}
            >
              <UserPlus size={20} className="mx-auto mb-2 opacity-60" />
              Add your first signer
            </Button>
          ) : (
            <div className="space-y-3">
              {signers.map((signer, i) => (
                <SignerCard
                  key={signer.id}
                  signer={signer}
                  signerIndex={i}
                  signingMode={doc.signing_mode}
                  documentId={id}
                  totalPages={totalPages}
                  signerFields={fieldsBySigner[signer.id] || []}
                  pageW={pageW}
                  pageH={pageH}
                  onRemove={handleRemoveSigner}
                  onApplied={refetch}
                />
              ))}
            </div>
          )}
        </div>

        {/* Send panel */}
        <div className="p-5 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <SendPanel
            documentId={id}
            onSent={() => {
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              navigate(`/dashboard/documents/${id}`);
            }}
          />
        </div>
      </div>

      {/* ── PDF Canvas ──────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-auto flex justify-center py-8 px-8"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 0.5px, transparent 0.5px)',
          backgroundSize: '20px 20px',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ width: pageW }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 rounded-xl mb-6 bg-white border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-600">Drag fields to reposition · click a signer to add more fields</p>
            {fields.length > 0 && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {fields.length} field{fields.length > 1 ? 's' : ''} placed
              </span>
            )}
          </div>

          <div className="relative">
            {pdfUrl ? (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={() => toast.error('Could not load PDF preview.')}
                loading={
                  <div className="flex items-center justify-center bg-white rounded-xl shadow-lg" style={{ height: pageH }}>
                    <div className="text-center space-y-3">
                      <Spinner size="md" />
                      <p className="text-xs font-medium text-gray-500">Loading PDF…</p>
                    </div>
                  </div>
                }
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <div key={i} style={{ marginBottom: i < totalPages - 1 ? PAGE_GAP : 0 }}>
                    <Page
                      pageNumber={i + 1}
                      width={pageW}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                    />
                  </div>
                ))}
              </Document>
            ) : (
              <div className="flex items-center justify-center bg-white rounded-xl shadow-lg" style={{ height: pageH }}>
                <p className="text-sm font-medium text-gray-500">No PDF file found.</p>
              </div>
            )}

            {/* ── Field overlays ─────────────────────────────────────────────
             * Each field is placed inside a page-sized absolutely positioned div
             * so the Draggable `bounds="parent"` constrains dragging within that page.
             *
             * Coordinate mapping:
             *   absX    = pos_x  (page-relative, no conversion needed)
             *   absY    = pos_y  (absolute canvas Y, includes PAGE_GAP offsets)
             *   pageOffset = pageIdx * (pageH + PAGE_GAP)
             *   pageRelY   = absY - pageOffset   (Y within this page div)
             */}
            {fields.map(field => {
              const pageIdx = (field.page ?? 1) - 1;
              const signerIdx = signers.findIndex(s => s.id === field.document_signer_id);
              const color = SIGNER_COLORS[Math.max(0, signerIdx) % SIGNER_COLORS.length];
              const signer = signers[signerIdx];

              const absX = field.position?.x ?? field.pos_x ?? 0;
              const absY = field.position?.y ?? field.pos_y ?? 0;

              // Cumulative canvas offset for this page (px), including PAGE_GAP
              const pageOffset = pageIdx * (pageH + PAGE_GAP);
              const pageRelY = absY - pageOffset;

              return (
                <div
                  key={field.id}
                  className="absolute pointer-events-none"
                  style={{
                    top: pageOffset,
                    left: 0,
                    width: pageW,
                    height: pageH,
                    zIndex: 15,
                  }}
                >
                  <div style={{ pointerEvents: 'auto', position: 'relative', width: '100%', height: '100%' }}>
                    <FieldOverlay
                      field={field}
                      pageRelX={absX}
                      pageRelY={pageRelY}
                      pageW={pageW}
                      pageH={pageH}
                      signerName={signer?.name ?? 'Signer'}
                      signerColor={color}
                      onRemove={handleRemoveField}
                      // Pass pageIdx so handleFieldMoved can reconstruct the absolute Y
                      onMoved={(fId, x, y) => handleFieldMoved(fId, x, y, pageIdx)}
                    />
                  </div>
                </div>
              );
            })}

            {/* Page dividers */}
            {totalPages > 1 && Array.from({ length: totalPages - 1 }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 pointer-events-none flex items-center justify-end pr-3"
                style={{
                  top: (i + 1) * pageH + i * PAGE_GAP,
                  height: PAGE_GAP,
                  zIndex: 12,
                  background: 'linear-gradient(to right, transparent, #d1d5db, transparent)',
                }}
              >
                <span className="text-[10px] font-bold text-gray-500 bg-white px-2 rounded">Page {i + 2}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddSignerModal
        open={signerModal}
        onClose={() => setSignerModal(false)}
        documentId={id}
        onAdded={refetch}
      />
    </div>
  );
}