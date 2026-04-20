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

export function SignerList({ signers = [], signingMode }) {
  if (signers.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">No signers added.</p>;
  }

  return (
    <div className="divide-y divide-gray-50">
      {signers.map((s, i) => {
        const roleInfo = SIGN_ROLES.find(r => r.value === s.sign_role);
        return (
          <div key={s.id} className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
              {getInitials(s.name)}
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
                <p className="text-xs text-green-600 mt-0.5">
                  Signed {formatDateTime(s.signed_at)}
                </p>
              )}
              {s.declined_at && s.decline_reason && (
                <p className="text-xs text-red-500 mt-0.5 truncate" title={s.decline_reason}>
                  Declined: {s.decline_reason}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                {statusIcons[s.status]}
                <Badge className={SIGNER_STATUS_COLORS[s.status]}>
                  {s.status_label}
                </Badge>
              </div>
              <Badge className={roleInfo?.color || 'bg-gray-100 text-gray-600'}>
                {s.sign_role}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}