import { formatDateTime, getInitials } from '@/utils/helpers';
import { FileText, CheckCircle, Send, XCircle, Eye, Clock, User } from 'lucide-react';

const eventConfig = {
 'document.created': { icon: FileText, color: 'bg-indigo-50 text-indigo-600', label: 'Created' },
 'document.sent': { icon: Send, color: 'bg-blue-50 text-blue-600', label: 'Sent' },
 'document.completed': { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', label: 'Completed' },
 'document.cancelled': { icon: XCircle, color: 'bg-red-50 text-red-600', label: 'Cancelled' },
 'document.expired': { icon: Clock, color: 'bg-orange-50 text-orange-600', label: 'Expired' },
 'signer.notified': { icon: Send, color: 'bg-indigo-50 text-indigo-600', label: 'Notified' },
 'signer.viewed': { icon: Eye, color: 'bg-amber-50 text-amber-600', label: 'Viewed' },
 'signer.signed': { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', label: 'Signed' },
 'signer.approved': { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', label: 'Approved' },
 'signer.declined': { icon: XCircle, color: 'bg-red-50 text-red-600', label: 'Declined' },
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
    <div className="absolute left-7 top-4 bottom-4 w-px bg-gray-100" />

    <div className="space-y-0">
    {logList.map((log, idx) => {
    const config = eventConfig[log.event] || {
    icon: User, color: 'bg-gray-100 text-gray-500', label: log.event,
    };
    const Icon = config.icon;

    return (
    <div key={log.id} className="flex gap-3 px-3 py-2.5 relative">
    {/* Icon bubble */}
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
    <Icon size={13} />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0 pt-0.5">
    <p className="text-sm font-bold text-gray-900 leading-snug">{log.description}</p>
    <div className="flex items-center justify-between gap-2 mt-1">
    <time className="text-[10px] font-medium text-gray-400">
    {formatDateTime(log.timestamp)}
    </time>
    {log.ip_address && (
    <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">{log.ip_address}</span>
    )}
    </div>
    </div>
    </div>
    );
    })}
    </div>
    </div>
 );
}