import { Users, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { getInitials } from '@/utils/helpers';

const statusStyles = {
  signed: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  declined: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
  viewed: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  notified: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  pending: { dot: 'bg-gray-300', bg: 'bg-gray-100', text: 'text-gray-500', icon: Clock },
};

export function SigningProgressCard({ doc, signers }) {
  const total = doc.counts?.total_signers || signers?.length || 0;
  const signed = doc.counts?.signed_count || 0;
  const progress = total > 0 ? Math.round((signed / total) * 100) : 0;

  return (
    <section className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
      {/* Header with progress */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Signing Progress</h3>
              <p className="text-[11px] text-gray-400 font-medium">{signed} of {total} signed</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-indigo-600">{progress}%</span>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Signer list */}
      {signers?.length > 0 && (
        <div className="border-t border-gray-100">
          {signers.map((s, i) => {
            const style = statusStyles[s.status] || statusStyles.pending;
            const StatusIcon = style.icon;
            const isCurrent = doc.current_signer?.id === s.id;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-5 py-3 ${i < signers.length - 1 ? 'border-b border-gray-50' : ''} ${isCurrent ? 'bg-indigo-50/50' : ''} transition-colors`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${style.bg} ${style.text}`}>
                  {s.status === 'signed'
                    ? <CheckCircle size={16} className="text-emerald-500" />
                    : getInitials(s.name)
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{s.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded leading-none">Active</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{s.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.signing_mode === 'sequential' && s.signing_order && (
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">#{s.signing_order}</span>
                  )}
                  <span className={`text-[11px] font-semibold leading-none ${style.text}`}>
                    {s.status_label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
