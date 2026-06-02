import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { SIGNATURE_FONTS } from '@/utils/constants';
import { classNames } from '@/utils/helpers';
import {
  PenLine, RotateCcw, CheckCircle, Trash2, Upload, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function DrawTab({ onSignatureReady, signatureData, saveToAccount, setSaveToAccount, maxReached = false }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPt = useRef(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const hasSaveCheckbox = saveToAccount !== undefined && setSaveToAccount !== undefined;

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
          className="w-full h-[140px] block cursor-crosshair touch-none"
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
          <Button size="sm" variant="secondary" onClick={clear}>
            <RotateCcw size={12} /> Clear
          </Button>
        </div>
      )}

      {hasSaveCheckbox ? (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveToAccount}
              onChange={e => setSaveToAccount(e.target.checked)}
              disabled={maxReached}
              className="w-3.5 h-3.5 accent-indigo-500"
            />
            <span className={classNames('text-xs', maxReached ? 'text-gray-400' : 'text-gray-500')}>
              {maxReached ? 'Maximum 6 signatures' : 'Save for future'}
            </span>
          </label>
          {signatureData && (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle size={12} />
              <span className="text-xs font-semibold">Ready</span>
            </div>
          )}
        </div>
      ) : signatureData && (
        <div className="mt-2 flex items-center gap-1.5 text-emerald-600">
          <CheckCircle size={12} />
          <span className="text-xs font-semibold">Ready to save</span>
        </div>
      )}
    </div>
  );
}

export function TypeTab({ signerName, onSignatureReady, signatureData, saveToAccount, setSaveToAccount, maxReached = false }) {
  const [text, setText] = useState(signerName || '');
  const [fontIdx, setFontIdx] = useState(0);
  const canvasRef = useRef(null);
  const hasSaveCheckbox = saveToAccount !== undefined && setSaveToAccount !== undefined;

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

    try { await document.fonts.load(`bold 56px ${fontFamily}`); } catch { /* Font may not load — fall back to system font */ }

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
    <div className="flex flex-col gap-2">
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
            className={`px-3.5 py-3 sm:py-1.5 rounded-lg text-base border transition-all min-h-[44px] ${
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
        <div className="p-5 rounded-xl bg-white border border-gray-200 text-center h-[140px] flex items-center justify-center">
          <span style={{ fontFamily: font.css, fontSize: 48, color: '#1e293b', fontWeight: 700 }}>
            {text}
          </span>
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center text-gray-400 text-xs h-[140px] flex items-center justify-center">
          Type your name above to preview
        </div>
      )}

      {hasSaveCheckbox ? (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveToAccount}
              onChange={e => setSaveToAccount(e.target.checked)}
              disabled={maxReached}
              className="w-3.5 h-3.5 accent-indigo-500"
            />
            <span className={classNames('text-xs', maxReached ? 'text-gray-400' : 'text-gray-500')}>
              {maxReached ? 'Maximum 6 signatures' : 'Save for future'}
            </span>
          </label>
          {signatureData && (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle size={12} />
              <span className="text-xs font-semibold">Ready</span>
            </div>
          )}
        </div>
      ) : signatureData && (
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle size={12} />
          <span className="text-xs font-semibold">Ready to save</span>
        </div>
      )}
    </div>
  );
}

export function UploadTab({ savedSignatures = [], onSignatureReady, signatureData, saveToAccount, setSaveToAccount, maxReached = false }) {
  const [preview, setPreview] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const hasSaveCheckbox = saveToAccount !== undefined && setSaveToAccount !== undefined;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const clear = useCallback(() => {
    setPreview(null);
    onSignatureReady(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onSignatureReady]);

  return (
    <div className="flex flex-col gap-2">
      {savedSignatures.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer font-inherit"
          >
            <span>Select your saved signature ({savedSignatures.length})</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {savedSignatures.map((sig) => (
                <button
                  key={sig.id}
                  onClick={() => { onSignatureReady(sig.data_uri); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer font-inherit border-b border-gray-50 last:border-b-0"
                >
                  <img src={sig.url} alt="" onError={(e) => { e.target.onerror = null; e.target.src = sig.data_uri || ''; }} className="h-8 max-w-24 object-contain flex-shrink-0" />
                  <span className="text-xs text-gray-600 truncate flex-1 text-left">{sig.label || 'Saved signature'}</span>
                  <span className="text-xs font-bold text-indigo-600 flex-shrink-0">Select</span>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 my-2" />
        </div>
      )}

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="h-[140px] flex items-center justify-center px-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div>
            <Upload size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500 mb-1">Click to upload a signature image</p>
            <p className="text-xs text-gray-400">PNG, JPG, SVG — max 2 MB</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="h-[140px] flex items-center justify-center bg-white">
            <img src={preview} alt="Signature preview" className="max-h-[140px] max-w-full object-contain" />
          </div>
          <div className="px-3.5 py-2.5 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">Signature ready</span>
            <button
              onClick={clear}
              className="flex items-center gap-1 px-3 py-2.5 rounded-md text-xs font-semibold bg-red-50 text-red-500 border border-red-200 cursor-pointer font-inherit min-h-[44px]"
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      )}

      {hasSaveCheckbox ? (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveToAccount}
              onChange={e => setSaveToAccount(e.target.checked)}
              disabled={maxReached}
              className="w-3.5 h-3.5 accent-indigo-500"
            />
            <span className={classNames('text-xs', maxReached ? 'text-gray-400' : 'text-gray-500')}>
              {maxReached ? 'Maximum 6 signatures' : 'Save for future'}
            </span>
          </label>
          {signatureData && (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle size={12} />
              <span className="text-xs font-semibold">Ready</span>
            </div>
          )}
        </div>
      ) : signatureData && (
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle size={12} />
          <span className="text-xs font-semibold">Ready to save</span>
        </div>
      )}
    </div>
  );
}
