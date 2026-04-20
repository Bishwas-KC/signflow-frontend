export const SIGNING_MODES = {
  SEQUENTIAL: 'sequential',
  BULK: 'bulk',
};

export const DOCUMENT_STATUSES = {
  DRAFT:       'draft',
  PENDING:     'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  CANCELLED:   'cancelled',
  EXPIRED:     'expired',
};

export const STATUS_LABELS = {
  draft:       'Draft',
  pending:     'Ready to Send',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  expired:     'Expired',
};

export const STATUS_COLORS = {
  draft:       'bg-gray-100 text-gray-600',
  pending:     'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-600',
  expired:     'bg-orange-100 text-orange-600',
};

export const FIELD_TYPES = [
  { value: 'signature',    label: 'Signature',    icon: '✒️',  color: '#4f46e5', w: 200, h: 60  },
  { value: 'initial',      label: 'Initial',      icon: '🖊️', color: '#0891b2', w: 100, h: 50  },
  { value: 'date_signed',  label: 'Date Signed',  icon: '📅',  color: '#059669', w: 150, h: 40  },
  { value: 'input_text',   label: 'Text Input',   icon: '✏️', color: '#d97706', w: 200, h: 40  },
  { value: 'company_seal', label: 'Company Seal', icon: '🔖',  color: '#7c3aed', w: 120, h: 120 },
];

export const SIGN_ROLES = [
  { value: 'signer',   label: 'Signer',   color: 'bg-indigo-100 text-indigo-700' },
  { value: 'approver', label: 'Approver', color: 'bg-purple-100 text-purple-700' },
  { value: 'cc',       label: 'CC',       color: 'bg-gray-100 text-gray-600'     },
];

export const SIGNER_STATUS_COLORS = {
  pending:  'bg-gray-100 text-gray-500',
  notified: 'bg-blue-100 text-blue-600',
  viewed:   'bg-yellow-100 text-yellow-600',
  signed:   'bg-green-100 text-green-700',
  approved: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-600',
};