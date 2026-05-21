import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { authApi } from '@/api/auth.api';
import { signApi } from '@/api/sign.api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getInitials } from '@/utils/helpers';
import toast from 'react-hot-toast';
import {
  Lock, Trash2, Plus, ChevronDown, ChevronUp, Camera,
  Bookmark, PenLine, Type, CheckCircle, RotateCcw, Upload,
} from 'lucide-react';

function DrawTab({ onSignatureReady, signatureData }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPt = useRef(null);
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
          <Button size="xs" variant="secondary" onClick={clear}>
            <RotateCcw size={12} /> Clear
          </Button>
        </div>
      )}
      {signatureData && (
        <div className="mt-2 flex items-center gap-1.5 text-emerald-600">
          <CheckCircle size={12} />
          <span className="text-xs font-semibold">Ready to save</span>
        </div>
      )}
    </div>
  );
}

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', css: "'Dancing Script', cursive" },
  { name: 'Great Vibes', css: "'Great Vibes', cursive" },
  { name: 'Pacifico', css: "'Pacifico', cursive" },
  { name: 'Satisfy', css: "'Satisfy', cursive" },
  { name: 'Allura', css: "'Allura', cursive" },
];

function TypeTab({ onSignatureReady, signatureData }) {
  const [text, setText] = useState('');
  const [fontIdx, setFontIdx] = useState(0);
  const canvasRef = useRef(null);

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

    try { await document.fonts.load(`bold 56px ${fontFamily}`); } catch {}

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
            className={`px-3.5 py-1.5 rounded-lg text-base border transition-all ${
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
      {signatureData && (
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle size={12} />
          <span className="text-xs font-semibold">Ready to save</span>
        </div>
      )}
    </div>
  );
}

function UploadTab({ onSignatureReady, signatureData }) {
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

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
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="h-[140px] flex items-center justify-center px-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div>
            <Upload size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500 mb-1">Click to upload a signature image</p>
            <p className="text-[11px] text-gray-400">PNG, JPG — max 2 MB</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="h-[140px] flex items-center justify-center bg-white">
            <img src={preview} alt="Signature preview" className="max-h-[140px] max-w-full object-contain" />
          </div>
          <div className="px-3.5 py-2.5 bg-gray-50 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Signature ready</span>
            <button
              onClick={clear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-500 border border-red-200 cursor-pointer font-inherit"
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        </div>
      )}
      {signatureData && (
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle size={12} />
          <span className="text-xs font-semibold">Ready to save</span>
        </div>
      )}
    </div>
  );
}

export function ProfileContent({ onSaved }) {
  const { user, saveSession } = useAuth();
  const token = localStorage.getItem('token');

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const [savedSignatures, setSavedSignatures] = useState([]);
  const [loadingSigs, setLoadingSigs] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  const [sigTab, setSigTab] = useState('upload');
  const [signatureData, setSignatureData] = useState(null);

  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchSignatures = useCallback(async () => {
    setLoadingSigs(true);
    try {
      const res = await signApi.getSavedSignatures();
      setSavedSignatures(res.data || []);
    } catch {
    } finally {
      setLoadingSigs(false);
    }
  }, []);

  useEffect(() => {
    fetchSignatures();
    setShowPassword(false);
    setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    setPasswordErrors({});
    setSignatureData(null);
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [fetchSignatures, avatarPreview]);

  const onSubmit = async (data) => {
    try {
      const res = await authApi.updateProfile(data);
      saveSession(res.data.user, token);
      toast.success('Profile updated.');
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});
    const errors = {};
    if (!passwordForm.current_password) errors.current_password = 'Current password is required.';
    if (!passwordForm.new_password) errors.new_password = 'New password is required.';
    else if (passwordForm.new_password.length < 8) errors.new_password = 'Min 8 characters.';
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      errors.new_password_confirmation = 'Passwords do not match.';
    }
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword(passwordForm);
      toast.success('Password changed successfully.');
      setShowPassword(false);
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to change password.';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureData) return;
    setSavingSignature(true);
    try {
      await signApi.saveNewSignature(signatureData);
      toast.success('Signature saved to your account.');
      setSignatureData(null);
      fetchSignatures();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save signature.');
    } finally {
      setSavingSignature(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setUploadingAvatar(true);
    try {
      const res = await authApi.uploadAvatar(file);
      saveSession(res.data.user, token);
      toast.success('Profile picture updated.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload avatar.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleDeleteSignature = async (id) => {
    try {
      await signApi.deleteSignature(id);
      setSavedSignatures(prev => prev.filter(s => s.id !== id));
      toast.success('Signature deleted.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete signature.');
    }
  };

  const sigTabs = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'draw', label: 'Draw', icon: PenLine },
    { key: 'type', label: 'Type', icon: Type },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── LEFT COLUMN ── */}
      <div className="space-y-6">
        {/* Avatar + Info */}
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl overflow-hidden hover:ring-2 hover:ring-indigo-400 transition-all group relative"
              >
                {(avatarPreview || user?.avatar)
                  ? <img src={avatarPreview || user.avatar} alt={user?.name} className="w-full h-full rounded-full object-cover" />
                  : getInitials(user?.name)
                }
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={16} className="text-white" />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {user?.has_google && (
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Google account</span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <Input
              label="Full Name"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
            />
            <Input label="Phone Number" placeholder="+977-98XXXXXXXX" {...register('phone')} />
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={isSubmitting}>Save Changes</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="space-y-6">
        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Lock size={16} className="text-gray-400" />
              Change Password
            </div>
            {showPassword ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showPassword && (
            <div className="mt-4 space-y-3">
              <Input
                label="Current Password"
                type="password"
                error={passwordErrors.current_password}
                value={passwordForm.current_password}
                onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
              />
              <Input
                label="New Password"
                type="password"
                error={passwordErrors.new_password}
                value={passwordForm.new_password}
                onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
              />
              <Input
                label="Confirm New Password"
                type="password"
                error={passwordErrors.new_password_confirmation}
                value={passwordForm.new_password_confirmation}
                onChange={e => setPasswordForm(p => ({ ...p, new_password_confirmation: e.target.value }))}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowPassword(false)}>Cancel</Button>
                <Button type="button" size="sm" loading={changingPassword} onClick={handleChangePassword}>Update Password</Button>
              </div>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Signatures</h3>

          {/* Saved Signatures List */}
          {loadingSigs ? (
            <p className="text-xs text-gray-400 mb-4">Loading signatures...</p>
          ) : savedSignatures.length > 0 ? (
            <div className="flex flex-wrap gap-3 mb-4">
              {savedSignatures.map(sig => (
                <div key={sig.id} className="relative group">
                  <div className="w-28 h-14 border border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1">
                    {sig.data_uri ? (
                      <img src={sig.data_uri} alt={sig.label || 'Signature'} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400">No preview</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSignature(sig.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-4">No saved signatures yet.</p>
          )}

          {/* Signature Creation Tabs */}
          <div className="border-t border-gray-100 pt-4">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100/80 rounded-lg mb-3">
              {sigTabs.map(t => {
                const Icon = t.icon;
                const active = sigTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { setSigTab(t.key); setSignatureData(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-inherit ${
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
            <div className="min-h-[200px]">
              {sigTab === 'draw' && <DrawTab onSignatureReady={setSignatureData} signatureData={signatureData} />}
              {sigTab === 'type' && <TypeTab onSignatureReady={setSignatureData} signatureData={signatureData} />}
              {sigTab === 'upload' && <UploadTab onSignatureReady={setSignatureData} signatureData={signatureData} />}
            </div>

            {/* Save Button */}
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                size="sm"
                loading={savingSignature}
                disabled={!signatureData}
                onClick={handleSaveSignature}
              >
                <Bookmark size={14} /> Save to Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
