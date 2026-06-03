export const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Ready to Send',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  declined: 'Declined',
  expired: 'Expired',
  failed: 'Failed',
  deleted: 'Deleted',
};

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  declined: 'bg-pink-100 text-pink-600',
  expired: 'bg-orange-100 text-orange-600',
  failed: 'bg-red-200 text-red-700',
  deleted: 'bg-gray-200 text-gray-500',
};

// Single field type
export const SIGNATURE_FIELD = {
  value: 'signature',
  label: 'Signature',
  color: '#4f46e5',
  width: 200,
  height: 120,
};

// ── PDF / Canvas ──────────────────────────────────────────────────────────
export const SCREEN_DPI = 96;
export const PDF_POINTS_INCH = 72;
export const PDF_PTS = PDF_POINTS_INCH;

// ── Type Signature Fonts ──────────────────────────────────────────────────
export const SIGNATURE_FONTS = [
  { name: 'Dancing Script', css: "'Dancing Script', cursive" },
  { name: 'Great Vibes', css: "'Great Vibes', cursive" },
  { name: 'Pacifico', css: "'Pacifico', cursive" },
  { name: 'Satisfy', css: "'Satisfy', cursive" },
  { name: 'Allura', css: "'Allura', cursive" },
];
