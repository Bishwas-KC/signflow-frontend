import { formatDateTime, getInitials } from '@/utils/helpers';
import { FileText, CheckCircle, Send, XCircle, Eye, Clock, User } from 'lucide-react';

const eventConfig = {
  'document.created':   { icon: FileText,     color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',   label: 'Created' },
  'document.sent':      { icon: Send,          color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',   label: 'Sent' },
  'document.completed': { icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Completed' },
  'document.cancelled': { icon: XCircle,       color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',     label: 'Cancelled' },
  'document.expired':   { icon: Clock,         color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', label: 'Expired' },
  'signer.notified':    { icon: Send,          color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Notified' },
  'signer.viewed':      { icon: Eye,           color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Viewed' },
  'signer.signed':      { icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',   label: 'Signed' },
  'signer.approved':    { icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Approved' },
  'signer.declined':    { icon: XCircle,       color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',        label: 'Declined' },
};

export function AuditLogTimeline({ logs = [] }) {
  const logList = Array.isArray(logs) ? logs : [];

  if (logList.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-9 top-4 bottom-4 w-px bg-gray-100 dark:bg-slate-800" />

      <div className="space-y-0">
        {logList.map((log, idx) => {
          const config = eventConfig[log.event] || {
            icon: User, color: 'bg-gray-100 text-gray-500', label: log.event,
          };
          const Icon = config.icon;

          return (
            <div key={log.id} className="flex gap-4 px-5 py-3 relative">
              {/* Icon bubble */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
                <Icon size={15} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{log.actor?.name}</span>
                      {log.ip_address && (
                        <>
                          <span className="text-gray-200 dark:text-slate-800">·</span>
                          <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">{log.ip_address}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <time className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-tighter flex-shrink-0 whitespace-nowrap pt-0.5">
                    {formatDateTime(log.timestamp)}
                  </time>
                </div>

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(log.metadata).map(([k, v]) => (
                      <span key={k} className="text-[9px] font-black uppercase tracking-widest bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 px-2 py-0.5 rounded-md border border-gray-100 dark:border-slate-800">
                        {k.replace(/_/g, ' ')}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}