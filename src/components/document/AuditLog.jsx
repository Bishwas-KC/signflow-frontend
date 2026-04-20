import { formatDateTime, getInitials } from '@/utils/helpers';
import { FileText, CheckCircle, Send, XCircle, Eye, Clock, User } from 'lucide-react';

const eventConfig = {
  'document.created':   { icon: FileText,     color: 'bg-gray-100 text-gray-600',   label: 'Created' },
  'document.sent':      { icon: Send,          color: 'bg-blue-100 text-blue-600',   label: 'Sent' },
  'document.completed': { icon: CheckCircle,   color: 'bg-green-100 text-green-700', label: 'Completed' },
  'document.cancelled': { icon: XCircle,       color: 'bg-red-100 text-red-600',     label: 'Cancelled' },
  'document.expired':   { icon: Clock,         color: 'bg-orange-100 text-orange-600', label: 'Expired' },
  'signer.notified':    { icon: Send,          color: 'bg-indigo-100 text-indigo-600', label: 'Notified' },
  'signer.viewed':      { icon: Eye,           color: 'bg-yellow-100 text-yellow-600', label: 'Viewed' },
  'signer.signed':      { icon: CheckCircle,   color: 'bg-green-100 text-green-700',   label: 'Signed' },
  'signer.approved':    { icon: CheckCircle,   color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  'signer.declined':    { icon: XCircle,       color: 'bg-red-100 text-red-600',        label: 'Declined' },
};

export function AuditLogTimeline({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-400">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-9 top-4 bottom-4 w-px bg-gray-100" />

      <div className="space-y-0">
        {logs.map((log, idx) => {
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
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-900">{log.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{log.actor.name}</span>
                      {log.ip_address && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400 font-mono">{log.ip_address}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <time className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </time>
                </div>

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {Object.entries(log.metadata).map(([k, v]) => (
                      <span key={k} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
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