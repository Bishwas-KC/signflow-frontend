import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { classNames } from '@/utils/helpers';
import { ArrowLeft, Download, Edit3, XCircle, Trash2, Clock } from 'lucide-react';

export function DocumentHeader({ doc, onCancel, onDelete }) {
  return (
    <div className="space-y-4">
      <Link
        to="/dashboard/documents"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Documents
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">{doc.title}</h1>
          {doc.description && (
            <p className="text-sm text-gray-500 mt-1 max-w-3xl leading-relaxed">{doc.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge size="sm" className={classNames('px-3 py-1 font-bold', STATUS_COLORS[doc.status])}>
              {STATUS_LABELS[doc.status]}
            </Badge>
            <Badge size="xs" variant="gray" className="px-2 capitalize leading-none">
              {doc.signing_mode}
            </Badge>
            {doc.expires_at && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <Clock size={12} />
                Expires {new Date(doc.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {doc.can_download_final && doc.file?.signed_url && (
            <a href={doc.file.signed_url} target="_blank" rel="noreferrer">
              <Button variant="primary" size="sm" className="rounded-lg">
                <Download size={14} /> Signed PDF
              </Button>
            </a>
          )}
          {doc.is_editable && (
            <Link to={`/dashboard/documents/${doc.id}/editor`}>
              <Button variant="secondary" size="sm" className="rounded-lg">
                <Edit3 size={14} /> Edit Fields
              </Button>
            </Link>
          )}
          {doc.can_cancel && (
            <Button variant="danger" size="sm" onClick={onCancel} className="rounded-lg">
              <XCircle size={14} /> Cancel
            </Button>
          )}
          {doc.can_delete && (
            <Button variant="danger" size="sm" onClick={onDelete} className="rounded-lg">
              <Trash2 size={14} /> Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
