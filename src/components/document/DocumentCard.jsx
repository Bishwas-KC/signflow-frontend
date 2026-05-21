import { Link } from 'react-router-dom';
import { FileText, Eye, Edit3, Trash2, Calendar, Users, ArrowUpRight, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';

function SignerBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200/50 leading-none">
      <Users size={10} />
      Signer
    </span>
  );
}

export function DocumentCard({ doc, onDelete, onRestore }) {
  const progress = doc.progress ?? 0;
  const signed = doc.counts?.signed_count ?? 0;
  const total = doc.counts?.total_signers ?? 0;
  const isEditable = ['draft', 'pending'].includes(doc.status);
  const isDeletable = doc.can_delete;
  const isRestorable = doc.can_restore;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200/70 hover:border-indigo-200/70 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col">
      {/* Top accent line */}
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <FileText size={20} className="text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {doc.title}
              </h3>
              {doc.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{doc.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {doc.role === 'signer' && <SignerBadge />}
            <Badge size="xs" className={`font-bold leading-none ${STATUS_COLORS[doc.status]}`}>
              {STATUS_LABELS[doc.status]}
            </Badge>
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-[11px] text-gray-400 font-medium mb-4 mt-auto">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={12} />
            {formatDate(doc.created_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={12} />
            {signed}/{total} signed
          </span>
          <Badge size="xs" variant="gray" className="font-semibold leading-none">{doc.signing_mode}</Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-[10px] font-semibold text-gray-400">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {doc.status !== 'deleted' && (
            <Link
              to={`/dashboard/documents/${doc.id}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-all"
            >
              Details <ArrowUpRight size={14} />
            </Link>
          )}
          {isEditable && (
            <Link
              to={`/dashboard/documents/${doc.id}/editor`}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Edit fields"
            >
              <Edit3 size={16} />
            </Link>
          )}
          {isDeletable && (
            <button
              onClick={() => onDelete(doc)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Delete document"
            >
              <Trash2 size={16} />
            </button>
          )}
          {isRestorable && (
            <button
              onClick={() => onRestore?.(doc)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
              title="Restore document"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
