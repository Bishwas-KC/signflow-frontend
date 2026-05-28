import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';
import { classNames } from '@/utils/helpers';
import { ArrowLeft, Download, Edit3, XCircle, Trash2, Clock, Calendar, User, Building, Shield } from 'lucide-react';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export function DocumentHeader({ doc, onCancel, onDelete }) {
  const handleDownload = async () => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'];
      const filename = disposition?.match(/filename="?(.+?)"?$/)?.[1] || 'document.pdf';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download document.');
    }
  };

  return (
    <div className="space-y-2">
      <Link
        to="/dashboard/documents"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Documents
      </Link>

      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1 w-full lg:w-auto">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">{doc.title}</h1>
          {doc.description && (
            <p className="text-xs text-gray-500 mt-1 max-w-3xl leading-relaxed">{doc.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
            <Badge size="sm" className={classNames('px-3 py-1 font-bold', STATUS_COLORS[doc.status])}>
              {STATUS_LABELS[doc.status]}
            </Badge>
            <Badge size="xs" variant="gray" className="px-2 capitalize leading-none">
              {doc.signing_mode}
            </Badge>
            {doc.expires_at ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <Clock size={12} />
                Expires {new Date(doc.expires_at).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-xs text-gray-400">No expiry</span>
            )}
            <span className="text-gray-300 mx-1">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-400" />
              {formatDate(doc.created_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User size={12} className="text-gray-400" />
              {doc.user?.name || '—'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building size={12} className="text-gray-400" />
              {doc.company?.name || 'Personal'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield size={12} className="text-gray-400" />
              {doc.file?.size_formatted || '—'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {doc.can_download_final && (
            <Button variant="primary" size="sm" onClick={handleDownload} className="rounded-lg">
              <Download size={14} /> Download PDF
            </Button>
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
