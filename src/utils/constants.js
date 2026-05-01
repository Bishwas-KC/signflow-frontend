export const SIGNING_MODES = {
  SEQUENTIAL: 'sequential',
  BULK:       'bulk',
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

export const SIGNER_STATUS_COLORS = {
  pending:  'bg-gray-100 text-gray-500',
  notified: 'bg-blue-100 text-blue-600',
  viewed:   'bg-yellow-100 text-yellow-600',
  signed:   'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
};

// Single field type
export const SIGNATURE_FIELD = {
  value:  'signature',
  label:  'Signature',
  color:  '#4f46e5',
  width:  200,
  height: 60,
};
export const SIGN_ROLES = [
    {
        value:       'signer',
        label:       'Signer',
        description: 'Must fill and sign fields. Required for completion.',
        color:       'bg-indigo-100 text-indigo-700',
    },
    {
        value:       'approver',
        label:       'Approver',
        description: 'Reviews and approves or rejects the document. No fields assigned.',
        color:       'bg-purple-100 text-purple-700',
    },
    {
        value:       'cc',
        label:       'CC',
        description: 'Receives a copy for information only. No action required.',
        color:       'bg-gray-100 text-gray-600',
    },
];