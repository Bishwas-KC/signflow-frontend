import { Link } from 'react-router-dom';
import { FileText, Eye, Edit3, Trash2, MoreVertical, Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, classNames } from '@/utils/helpers';

export function DocumentCard({ doc, onDelete }) {
  const progress = doc.progress ?? 0;
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group animate-fade-in relative flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
          <FileText size={24} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge size="xs" className={classNames('font-black', STATUS_COLORS[doc.status])}>
            {STATUS_LABELS[doc.status]}
          </Badge>
          {doc.role === 'signer' && (
            <span className="text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded uppercase tracking-wider">
              Signing Request
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {doc.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-500 font-medium line-clamp-1 mb-4">
          {doc.description || 'No description provided.'}
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              {formatDate(doc.created_at)}
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={12} />
              {doc.counts?.signed_count ?? 0}/{doc.counts?.total_signers ?? 0}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-slate-800">
        <Link to={`/dashboard/documents/${doc.id}`} className="flex-1">
          <button className="w-full py-2 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
            Details
          </button>
        </Link>
        <div className="flex gap-1">
          {['draft', 'pending'].includes(doc.status) && (
            <Link to={`/dashboard/documents/${doc.id}/editor`} title="Edit Fields">
              <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors">
                <Edit3 size={16} />
              </button>
            </Link>
          )}
          {doc.status !== 'in_progress' && (
            <button
              onClick={() => onDelete(doc)}
              title="Delete Document"
              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
