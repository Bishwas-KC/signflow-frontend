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
import { getInitials, classNames } from '@/utils/helpers';
import {
  ArrowLeft,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Clock,
  Menu,
} from 'lucide-react';
import toast from 'react-hot-toast';

pdfjs.GlobalWorkerOptions.workerSrc =
 `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DEFAULT_PAGE_W = 794;
const DEFAULT_PAGE_H = 1123;
const SCREEN_DPI = 96;
const PDF_POINTS_INCH = 72;

const SIGNER_COLORS = [
 { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-600', border: 'border-indigo-300', ring: 'ring-indigo-200', light: 'bg-indigo-100' },
 { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-600', border: 'border-emerald-300', ring: 'ring-emerald-200', light: 'bg-emerald-100' },
 { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-600', border: 'border-purple-300', ring: 'ring-purple-200', light: 'bg-purple-100' },
 { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-600', border: 'border-orange-300', ring: 'ring-orange-200', light: 'bg-orange-100' },
 { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-600', border: 'border-sky-300', ring: 'ring-sky-200', light: 'bg-sky-100' },
 { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-600', border: 'border-pink-300', ring: 'ring-pink-200', light: 'bg-pink-100' },
];

// ─── Overlap Detection ─────────────────────────────────────────────────────────
const OVERLAP_PADDING = 8;

function rectsOverlap(a, b) {
 return !(
 a.x + a.w - OVERLAP_PADDING < b.x ||
 b.x + b.w - OVERLAP_PADDING < a.x ||
 a.y + a.h - OVERLAP_PADDING < b.y ||
 b.y + b.h - OVERLAP_PADDING < a.y
 );
}

function getFieldRect(field, pageW, pageH) {
 const pos = field.position || {};
 const w = pos.width ?? field.width ?? SIGNATURE_FIELD.width;
 const h = pos.height ?? field.height ?? SIGNATURE_FIELD.height;
 const x = pos.x ?? field.pos_x ?? 0;
 const y = pos.y ?? field.pos_y ?? 0;
 return { x, y, w, h };
}

function findNonOverlappingPosition(pageW, pageH, fieldWidth, fieldHeight, allPageFields, excludeId) {
 const fieldsOnPage = allPageFields.filter(f => f.id !== excludeId);
 if (fieldsOnPage.length === 0) {
 return { x: Math.round((pageW - fieldWidth) / 2), y: 60 };
 }

 const startY = 60;
 const stepY = fieldHeight + 16;
 const cols = 2;
 const colWidth = Math.round((pageW - 40) / cols);

 for (let row = 0; row < 50; row++) {
 for (let col = 0; col < cols; col++) {
 const x = 20 + col * colWidth + Math.round((colWidth - fieldWidth) / 2);
 const y = startY + row * stepY;

 if (y + fieldHeight > pageH - 40) continue;

 const candidate = { x, y, w: fieldWidth, h: fieldHeight };
 const overlaps = fieldsOnPage.some(f => rectsOverlap(candidate, getFieldRect(f, pageW, pageH)));

 if (!overlaps) {
 return { x, y };
 }
 }
 }

 return null;
}

function wouldOverlap(newX, newY, excludeId, allFields, fieldW, fieldH) {
 const candidate = { x: newX, y: newY, w: fieldW, h: fieldH };
 return allFields.some(f => {
 if (f.id === excludeId) return false;
 return rectsOverlap(candidate, getFieldRect(f));
 });
}

// ─── parsePageInput ────────────────────────────────────────────────────────────
function parsePageInput(input, totalPages) {
 const parts = input.split(',').map(s => s.trim()).filter(Boolean);
 const pages = new Set();
 const errors = [];

 for (const part of parts) {
 // Support ranges like "1-5" or "3-7"
 if (part.includes('-') && !part.includes(' ')) {
 const [startStr, endStr] = part.split('-').map(s => s.trim());
 const start = parseInt(startStr, 10);
 const end = parseInt(endStr, 10);
 
 if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
 errors.push(`"${part}" is not a valid page range`);
 continue;
 }
 
 let rangeValid = true;
 for (let i = start; i <= end; i++) {
 if (i > totalPages) {
 errors.push(`Page ${i} does not exist (document has ${totalPages} page${totalPages > 1 ? 's' : ''})`);
 rangeValid = false;
 break;
 }
 pages.add(i);
 }
 if (!rangeValid) continue;
 } else {
 const num = parseInt(part, 10);
 if (isNaN(num) || num < 1) {
 errors.push(`"${part}" is not a valid page number`);
 continue;
 }
 if (num > totalPages) {
 errors.push(`Page ${num} does not exist (document has ${totalPages} page${totalPages > 1 ? 's' : ''})`);
 continue;
 }
 pages.add(num);
 }
 }

 return { pages: [...pages].sort((a, b) => a - b), errors };
}

// ─── FieldOverlay ──────────────────────────────────────────────────────────────
function FieldOverlay({ field, pageRelX, pageRelY, pageW, pageH, signerName, signerColor, allFields, onRemove, onMoved }) {
 const nodeRef = useRef(null);
 const [key, setKey] = useState(0);
 const w = field.position?.width ?? field.width ?? SIGNATURE_FIELD.width;
 const h = field.position?.height ?? field.height ?? SIGNATURE_FIELD.height;
 const startX = pageRelX;
 const startY = pageRelY;
 const startPos = { x: startX, y: startY };

 const handleStop = (_, d) => {
 let newX = Math.round(d.x);
 let newY = Math.round(d.y);

 newX = Math.max(0, Math.min(newX, pageW - w));
 newY = Math.max(0, Math.min(newY, pageH - h));

 if (wouldOverlap(newX, newY, field.id, allFields, w, h)) {
 setKey(k => k + 1);
 toast.error('Cannot place here — overlaps another signature field');
 return;
 }

 onMoved(field.id, newX, newY);
 };

 return (
 <Draggable
 nodeRef={nodeRef}
 defaultPosition={startPos}
 key={key}
 onStop={handleStop}
 >
 <div
 ref={nodeRef}
 className="absolute top-0 left-0 group cursor-grab active:cursor-grabbing select-none"
 style={{ width: w, zIndex: 50 }}
 >
 <div
 className={classNames(
 'w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-lg border-2 transition-all hover:shadow-md',
 signerColor.bg, signerColor.text, signerColor.border
 )}
 style={{ height: h }}
 >
 <GripVertical size={12} className="opacity-40 flex-shrink-0" />
 <span className="truncate">Sign — P{field.page}</span>
 </div>
 <div className={classNames('text-center truncate px-1 text-[10px] font-medium leading-tight mt-1', signerColor.text)}>
 {signerName}
 </div>
 <button
 onMouseDown={e => { e.stopPropagation(); onRemove(field.id); }}
 className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow-md z-30 hover:bg-red-600 transition-colors"
 >
 <X size={10} strokeWidth={3} />
 </button>
 </div>
 </Draggable>
 );
}

// ─── SignerPageSelector ────────────────────────────────────────────────────────
function SignerPageSelector({ signer, signerColor, documentId, totalPages, allFields, pageW, pageH, onApplied }) {
 const [mode, setMode] = useState(null);
 const [pageInput, setPageInput] = useState('');
 const [applying, setApplying] = useState(false);
 const [open, setOpen] = useState(false);

 const signerFields = allFields.filter(f => f.document_signer_id === signer.id);
 const signedPages = [...new Set(signerFields.map(f => f.page))].sort((a, b) => a - b);
 const initialized = useRef(false);

  useEffect(() => {
    if (mode === 'select' && open && !initialized.current) {
      setPageInput(signedPages.length > 0 ? signedPages.join(', ') : '');
      initialized.current = true;
    }
    if (!open) {
      initialized.current = false;
    }
  }, [mode, open, signedPages]);

 const getDropdownLabel = () => {
 if (signerFields.length === 0) return 'Sign required on pages';
 if (signedPages.length === totalPages) return `Sign required on all ${totalPages} pages`;
 return `Sign required on pages ${signedPages.join(', ')}`;
 };

 const handleApply = async () => {
 let pages;

 if (mode === 'all') {
 pages = Array.from({ length: totalPages }, (_, i) => i + 1);
 } else if (mode === 'select') {
 const { pages: parsed, errors } = parsePageInput(pageInput, totalPages);
 if (errors.length > 0) {
 errors.forEach(e => toast.error(e));
 return;
 }
 if (parsed.length === 0) {
 toast.error('Please enter at least one valid page number');
 return;
 }
 pages = parsed;
 } else {
 toast.error('Please select an option');
 return;
 }

 setApplying(true);
 try {
 // Step 1: Remove ALL existing fields for this signer
 const existingFields = allFields.filter(f => f.document_signer_id === signer.id);
 
 // Security: Validate that pages don't have overlapping fields for same signer
 const duplicatePages = pages.filter((p, i) => pages.indexOf(p) !== i);
 if (duplicatePages.length > 0) {
 toast.error(`Duplicate pages detected: ${[...new Set(duplicatePages)].join(', ')}. Please fix your input.`);
 setApplying(false);
 return;
 }
 
 // Warn user if replacing many fields (UX improvement)
 if (existingFields.length > 0) {
 const confirmed = window.confirm(
 `This will remove ${existingFields.length} existing field${existingFields.length > 1 ? "s" : ""} for ${signer.name} and create new ones on pages ${pages.join(", ")}. Continue?`
 );
 if (!confirmed) {
 setApplying(false);
 return;
 }
 }

 if (existingFields.length > 0) {
 toast.loading(`Removing ${existingFields.length} old field${existingFields.length > 1 ? 's' : ''}...`, { id: 'removing' });
 
 // Remove fields in parallel for efficiency
 const removePromises = existingFields.map(f => 
 documentApi.removeField(documentId, f.id).catch(err => {
 console.warn('Failed to remove field', f.id, err);
 return null; // Continue with others even if one fails
 })
 );
 
 const results = await Promise.all(removePromises);
 const removedCount = results.filter(r => r !== null).length;
 
 toast.dismiss('removing');
 
 if (removedCount < existingFields.length) {
 toast.error(`Removed ${removedCount} of ${existingFields.length} fields. Some may have failed.`);
 }
 }

 // Step 2: Create new fields for selected pages
 const fieldsToCreate = [];

 for (const page of pages) {
 // Only check for overlaps with fields from OTHER signers (not the one we just removed)
 const existingOnPage = allFields.filter(f => 
 Number(f.page) === page && f.document_signer_id !== signer.id
 );
 const pos = findNonOverlappingPosition(pageW, pageH, SIGNATURE_FIELD.width, SIGNATURE_FIELD.height, existingOnPage);

 if (!pos) {
 toast.error(`No space left for a signature field on page ${page}`);
 continue;
 }

 fieldsToCreate.push({
 page,
 pos_x: pos.x,
 pos_y: pos.y,
 width: SIGNATURE_FIELD.width,
 height: SIGNATURE_FIELD.height,
 document_signer_id: signer.id,
 required: true,
 });
 }

 if (fieldsToCreate.length === 0) {
 toast.error('Could not place any fields — all selected pages are full');
 return;
 }

 // Step 3: Add new fields (bulk if multiple, single if one)
 if (fieldsToCreate.length === 1) {
 await documentApi.addField(documentId, fieldsToCreate[0]);
 } else {
 await documentApi.bulkAddFields(documentId, fieldsToCreate);
 }

 toast.success(
 `Replaced fields: ${fieldsToCreate.length} signature field${fieldsToCreate.length > 1 ? 's' : ''} now on pages ${pages.join(', ')} for ${signer.name}`,
 { duration: 4000 }
 );
 
 setPageInput('');
 setMode(null);
 setOpen(false);
 onApplied();
 } catch (err) {
 toast.error(err?.response?.data?.error?.message || 'Failed to apply fields');
 } finally {
 setApplying(false);
 }
 };

 return (
 <div className="px-3 pb-3">
 <button
 onClick={() => setOpen(!open)}
 className={classNames(
 'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
 open ? signerColor.bg : 'hover:bg-gray-50'
 )}
 >
 <span className={classNames(
 'truncate',
 open ? signerColor.text : signerFields.length > 0 ? signerColor.text : 'text-gray-500'
 )}>
 {getDropdownLabel()}
 </span>
 {open ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0 ml-2" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0 ml-2" />}
 </button>

 {open && (
 <div className="mt-2 space-y-3 animate-fade-in">
 {/* All Pages option */}
 <button
 onClick={() => setMode('all')}
 className={classNames(
 'w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors border',
 mode === 'all'
 ? classNames(signerColor.bg, signerColor.border, signerColor.text)
 : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
 )}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className={classNames('w-4 h-4 rounded-full border-2 flex items-center justify-center',
 mode === 'all' ? signerColor.border : 'border-gray-300')}>
 {mode === 'all' && <div className={classNames('w-2.5 h-2.5 rounded-full', signerColor.dot)} />}
 </div>
 <span className="font-medium">All Pages</span>
 </div>
 <span className="text-xs text-gray-400">{totalPages} pages</span>
 </div>
 </button>

 {/* Select Pages option */}
 <div className={classNames(
 'rounded-lg border transition-colors',
 mode === 'select' ? signerColor.border : 'border-gray-200'
 )}>
 <button
 onClick={() => setMode('select')}
 className={classNames(
 'w-full px-3 py-2.5 rounded-t-lg text-sm text-left transition-colors flex items-center gap-2',
 mode === 'select' ? signerColor.text : 'text-gray-700'
 )}
 >
 <div className={classNames('w-4 h-4 rounded-full border-2 flex items-center justify-center',
 mode === 'select' ? signerColor.border : 'border-gray-300')}>
 {mode === 'select' && <div className={classNames('w-2.5 h-2.5 rounded-full', signerColor.dot)} />}
 </div>
 <span className="font-medium">Select Pages</span>
 </button>

 {mode === 'select' && (
 <div className="px-3 pb-3">
 <Input
 value={pageInput}
 onChange={e => setPageInput(e.target.value)}
 placeholder="e.g. 1,2,6,3"
 className="text-sm"
 />
 <p className="text-[11px] text-gray-400 mt-1">Enter page numbers separated by commas</p>
 </div>
 )}
 </div>

 <Button
 onClick={handleApply}
 disabled={applying || !mode || (mode === 'select' && !pageInput.trim())}
 className="w-full"
 size="sm"
 >
 {applying ? <Spinner size="xs" /> : <Plus size={14} />}
 {mode === 'all' ? `Add to all ${totalPages} pages` : mode === 'select' ? 'Add to selected pages' : 'Add fields'}
 </Button>
 </div>
 )}
 </div>
 );
}

// ─── SignerCard ────────────────────────────────────────────────────────────────
function SignerCard({ signer, signerIndex, documentId, totalPages, allFields, pageW, pageH, onRemove, onApplied }) {
 const color = SIGNER_COLORS[signerIndex % SIGNER_COLORS.length];

 return (
 <div className={classNames(
 'rounded-xl border overflow-hidden transition-all',
 'border-gray-200 bg-white'
 )}>
 {/* Signer header */}
 <div className={classNames('flex items-center gap-3 px-4 py-3', color.bg)}>
 <div className={classNames('w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0', color.dot)}>
 {getInitials(signer.name)}
 </div>
 <div className="flex-1 min-w-0">
 {signer.signing_order && (
 <span className="text-[10px] font-medium text-gray-400">
 #{signer.signing_order}
 </span>
 )}
 <p className="text-sm font-semibold truncate leading-tight text-gray-900">{signer.name}</p>
 <p className="text-xs text-gray-500 truncate">{signer.email}</p>
 </div>
 <button
 onClick={() => onRemove(signer.id)}
 className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
 >
 <Trash2 size={13} />
 </button>
 </div>

 {/* Page selector dropdown */}
 <SignerPageSelector
 signer={signer}
 signerColor={color}
 documentId={documentId}
 totalPages={totalPages}
 allFields={allFields}
 pageW={pageW}
 pageH={pageH}
 onApplied={onApplied}
 />
 </div>
 );
}

// ─── AddSignerModal ────────────────────────────────────────────────────────────
function AddSignerModal({ open, onClose, documentId, onAdded }) {
 const [tab, setTab] = useState('manual');
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [saving, setSaving] = useState(false);

 const { data: contactsData, isLoading: contactsLoading } = useQuery({
 queryKey: ['contacts-picker'],
 queryFn: () => contactApi.list({ per_page: 100 }),
 enabled: open && tab === 'contacts',
 });

 const reset = () => { setName(''); setEmail(''); };

 const add = async (payload) => {
 setSaving(true);
 try {
 await documentApi.addSigner(documentId, payload);
 toast.success(`${payload.name} added`);
 onAdded();
 onClose();
 reset();
 } catch (err) {
 toast.error(err?.response?.data?.error?.message || 'Failed to add signer');
 } finally {
 setSaving(false);
 }
 };

 return (
 <Modal open={open} onClose={() => { onClose(); reset(); }} title="Add Signer" size="sm">
 <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-5">
 <button
 onClick={() => setTab('manual')}
 className={classNames(
 'flex-1 py-1.5 rounded-md text-xs font-medium transition-all',
 tab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
 )}
 >
 Manual
 </button>
 <button
 onClick={() => setTab('contacts')}
 className={classNames(
 'flex-1 py-1.5 rounded-md text-xs font-medium transition-all',
 tab === 'contacts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
 )}
 >
 Contacts
 </button>
 </div>

 {tab === 'manual' ? (
 <div className="space-y-4">
 <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" autoFocus />
 <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
 <Button className="w-full" loading={saving} disabled={!name.trim() || !email.trim()} onClick={() => add({ name: name.trim(), email: email.trim() })}>
 <Plus size={14} /> Add Signer
 </Button>
 </div>
 ) : (
 <div className="space-y-1 max-h-72 overflow-y-auto">
 {contactsLoading ? (
 <div className="flex justify-center py-10"><Spinner /></div>
 ) : !contactsData?.data?.length ? (
 <div className="text-center py-10">
 <UserPlus size={28} className="mx-auto text-gray-200 mb-3" />
 <p className="text-xs text-gray-400">No contacts found</p>
 </div>
 ) : (
 contactsData.data.map(c => (
 <button
 key={c.id}
 onClick={() => add({ name: c.full_name, email: c.email, contact_id: c.id })}
 className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
 >
 <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">
 {c.initials}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-gray-900 truncate">{c.full_name}</p>
 <p className="text-xs text-gray-400 truncate">{c.email}</p>
 </div>
 <Plus size={14} className="text-gray-300" />
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
  const [expiredError, setExpiredError] = useState(false);

  const runValidate = async () => {
    setValidating(true);
    setExpiredError(false);
    try {
      const res = await documentApi.validate(documentId);
      setResult(res.data);
    } catch {
      toast.error('Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const runSend = async () => {
    setSending(true);
    setExpiredError(false);
    try {
      await documentApi.send(documentId);
      toast.success('Document sent');
      onSent();
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === 'DOCUMENT_EXPIRED') {
        setExpiredError(true);
      } else {
        toast.error(err?.response?.data?.error?.message || 'Failed to send');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      {expiredError && (
        <div className="rounded-lg p-3 text-xs flex items-start gap-2 bg-red-50 text-red-700 border border-red-100">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Document has expired</p>
            <p className="text-[11px] opacity-80 mt-1">The expiry date has passed. Update the expiry date in the document settings, then validate and send.</p>
          </div>
        </div>
      )}
      {result && !expiredError && (
        <div className={classNames(
          'rounded-lg p-3 text-xs flex items-start gap-2',
          result.valid
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-red-50 text-red-700 border border-red-100'
        )}>
          {result.valid ? <CheckCircle size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
          <div>
            {result.valid ? (
              <p className="font-medium">Ready to send</p>
            ) : (
              <div>
                <p className="font-medium mb-1">Issues found</p>
                <ul className="space-y-0.5 list-disc pl-4 text-[11px] opacity-80">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" size="sm" loading={validating} onClick={runValidate}>
          <CheckCircle size={14} /> Validate
        </Button>
        <Button className="flex-1" size="sm" disabled={!result?.valid || expiredError} loading={sending} onClick={runSend}>
          <Send size={14} /> Send
        </Button>
      </div>
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
 return `${w}×${h}`;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);


  const { data, isLoading, refetch } = useQuery({
  queryKey: ['document', id],
  queryFn: () => documentApi.get(id),
  });

  const doc = data?.data?.document;

  const [expiryDate, setExpiryDate] = useState('');
  useEffect(() => {
    if (doc?.expires_at) {
      const d = new Date(doc.expires_at);
      setExpiryDate(d.toISOString().slice(0, 16));
    }
  }, [doc?.expires_at]);

  const handleUpdateExpiry = async (e) => {
    const val = e.target.value;
    setExpiryDate(val);
    try {
      const saveVal = val ? val.replace('T', ' ') + ':00' : null;
      await documentApi.update(id, { expires_at: saveVal });
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update expiry date');
    }
  };

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
 toast.error('Failed to save position');
 }
 }, [id, refetch]);

 const handleRemoveField = useCallback(async (fieldId) => {
 try {
 await documentApi.removeField(id, fieldId);
 refetch();
 toast.success('Field removed');
 } catch {
 toast.error('Failed to remove field');
 }
 }, [id, refetch]);

 const handleRemoveSigner = useCallback(async (signerId) => {
 try {
 await documentApi.removeSigner(id, signerId);
 refetch();
 toast.success('Signer removed');
 } catch (err) {
 toast.error(err?.response?.data?.error?.message || 'Failed to remove signer');
 }
 }, [id, refetch]);

 if (isLoading) return (
 <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-50">
 <Spinner size="lg" />
 <p className="text-sm text-gray-500">Loading document...</p>
 </div>
 );

 if (!doc) return (
 <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">
 Document not found
 </div>
 );

  const signers = doc.signers || [];
  const fields = doc.fields || [];
  const pdfUrl = doc.file?.preview_url ?? doc.file?.original_url;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => navigate(`/dashboard/documents/${id}`)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 mb-3 group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
        <h1 className="text-base font-semibold text-gray-900 truncate">{doc.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400">{totalPages} pages</span>
          <span className="text-gray-300">·</span>
          <Badge variant="indigo" size="xs">{doc.signing_mode}</Badge>
          <span className="text-xs text-gray-400">{doc.status_label}</span>
        </div>
      </div>

      {/* Expiry date editor */}
      <div className="px-5 py-3 border-b border-gray-100">
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1.5">
          <Clock size={12} /> Expiry Date
        </label>
        <input
          type="datetime-local"
          value={expiryDate}
          onChange={handleUpdateExpiry}
          min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900"
        />
      </div>

      {/* Signers section - takes most of the space */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-gray-500">Signers</p>
          <button
            onClick={() => setSignerModal(true)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <UserPlus size={13} /> Add
          </button>
        </div>

        {signers.length === 0 ? (
          <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <UserPlus size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400 mb-3">Add a signer to start</p>
            <Button size="sm" variant="secondary" onClick={() => setSignerModal(true)}>Add Signer</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {signers.map((signer, i) => (
              <SignerCard
                key={signer.id}
                signer={signer}
                signerIndex={i}
                documentId={id}
                totalPages={totalPages}
                allFields={fields}
                pageW={pageW}
                pageH={pageH}
                onRemove={handleRemoveSigner}
                onApplied={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Send panel - compact at bottom */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <SendPanel documentId={id} onSent={() => {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          navigate(`/dashboard/documents/${id}`);
        }} />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-80 flex-shrink-0 flex-col overflow-hidden bg-white border-r border-gray-200 z-20">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50 w-80 animate-slide-right shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile banner */}
        <div className="lg:hidden px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700 font-medium text-center">
          For best experience, use a tablet or desktop.
        </div>

        {/* Mobile toggle bar */}
        <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all">
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-900 truncate">{doc.title}</span>
        </div>

        <div className="flex-1 overflow-auto flex justify-center py-8 px-4 lg:px-8 bg-gray-100/50 relative">
 <div style={{ width: pageW }} className="animate-fade-in">
 {/* Canvas toolbar */}
 <div className="flex items-center justify-between px-4 py-2 rounded-lg mb-6 bg-white border border-gray-200 shadow-sm">
 <p className="text-xs text-gray-400">Drag fields to reposition</p>
 {fields.length > 0 && (
 <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
 {fields.length} field{fields.length > 1 ? 's' : ''} placed
 </span>
 )}
 </div>

 {/* PDF Pages */}
 <div className="relative">
 {pdfUrl ? (
 <Document
 file={pdfUrl}
 onLoadSuccess={onDocumentLoadSuccess}
 loading={
 <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-lg border border-gray-200" style={{ height: pageH }}>
 <Spinner size="lg" />
 <p className="text-xs text-gray-400 mt-3">Loading PDF...</p>
 </div>
 }
 >
 {Array.from({ length: totalPages }, (_, i) => (
 <div key={i} className="relative mb-4">
 <div className="shadow-lg">
 <Page
 pageNumber={i + 1}
 width={pageW}
 renderAnnotationLayer={false}
 renderTextLayer={false}
 className="rounded-lg overflow-hidden bg-white"
 />
 </div>

 {/* Field overlays */}
 {fields.filter(f => Number(f.page) === i + 1).map(field => {
 const signerIdx = signers.findIndex(s => s.id === field.document_signer_id);
 const color = SIGNER_COLORS[Math.max(0, signerIdx) % SIGNER_COLORS.length];
 const signer = signers[signerIdx];
 const pos = field.position || {};
 const absX = pos.x ?? field.pos_x ?? 0;
 const pageRelY = pos.y ?? field.pos_y ?? 0;

 return (
 <FieldOverlay
 key={field.id}
 field={field}
 pageRelX={absX}
 pageRelY={pageRelY}
 pageW={pageW}
 pageH={pageH}
 signerName={signer?.name ?? 'Signer'}
 signerColor={color}
 allFields={fields.filter(f => Number(f.page) === i + 1)}
 onRemove={handleRemoveField}
 onMoved={(fId, x, y) => handleFieldMoved(fId, x, y, i)}
 />
 );
 })}

 {/* Page separator */}
 {i < totalPages - 1 && (
 <div className="flex items-center justify-center py-2">
 <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
 Page {i + 2}
 </span>
 </div>
 )}
 </div>
 ))}
 </Document>
 ) : (
 <div className="flex items-center justify-center bg-white rounded-xl shadow-lg border border-gray-200" style={{ height: pageH }}>
 <p className="text-xs text-gray-400">No preview available</p>
 </div>
  )}
  </div>
  </div>
  </div>
  </div>

  <AddSignerModal open={signerModal} onClose={() => setSignerModal(false)} documentId={id} onAdded={refetch} />
  </div>
 );
}
