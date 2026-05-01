import { Badge } from '@/components/ui/Badge';
import { SIGN_ROLES, SIGNER_STATUS_COLORS } from '@/utils/constants';
import { formatDateTime, getInitials } from '@/utils/helpers';
import { CheckCircle, Clock, Eye, XCircle } from 'lucide-react';

const statusIcons = {
  pending:  <Clock size={13} className="text-gray-400" />,
  notified: <Clock size={13} className="text-blue-400" />,
  viewed:   <Eye size={13} className="text-yellow-500" />,
  signed:   <CheckCircle size={13} className="text-green-500" />,
  approved: <CheckCircle size={13} className="text-emerald-500" />,
  declined: <XCircle size={13} className="text-red-500" />,
};

// Remove the roleConfig object and roleInfo references
// Remove the role Badge entirely from each signer row
// Keep only: name, email, status badge, signed_at

export function SignerList({ signers = [], signingMode }) {
  if (!signers.length) {
    return <p className="text-xs text-gray-400 text-center py-4">No signers added yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-50">
      {signers.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3 px-5 py-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
            {s.name?.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {signingMode === 'sequential' && s.signing_order && (
                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 rounded">
                  #{s.signing_order}
                </span>
              )}
              <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
            </div>
            <p className="text-xs text-gray-500 truncate">{s.email}</p>
            {s.signed_at && (
              <p className="text-xs text-green-600 mt-0.5">Signed {formatDateTime(s.signed_at)}</p>
            )}
          </div>
          <Badge className={SIGNER_STATUS_COLORS[s.status]}>
            {s.status_label}
          </Badge>
        </div>
      ))}
    </div>
  );
}