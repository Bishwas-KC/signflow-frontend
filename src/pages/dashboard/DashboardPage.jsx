import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { documentApi } from '@/api/document.api';
import { useAuth } from '@/hooks/useAuth';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCardSkeleton, DocumentRowSkeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';
import { FileText, FilePlus, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';

function StatCard({ label, value, icon: Icon, colorClass, loading }) {
  if (loading) return <StatCardSkeleton />;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Stats — controller returns: { success, data: { stats: { draft, pending, ... } } }
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['document-stats'],
    queryFn:  documentApi.stats,
  });

  // Recent docs — controller returns: { success, data: [...], meta: {...} }
  const { data: docsRes, isLoading: docsLoading } = useQuery({
    queryKey: ['recent-documents'],
    queryFn:  () => documentApi.list({ per_page: 6, sort_by: 'created_at', sort_dir: 'desc' }),
  });

  // Correct shape: statsRes.data.stats (the axios instance returns res.data, so this is already unwrapped)
  const stats    = statsRes?.data?.stats   || {};
  const recentDocs = docsRes?.data         || [];

  const statCards = [
    { label: 'Total',       value: stats.total,       icon: FileText,    colorClass: 'bg-gray-500'   },
    { label: 'In Progress', value: stats.in_progress, icon: Clock,       colorClass: 'bg-yellow-500' },
    { label: 'Completed',   value: stats.completed,   icon: CheckCircle, colorClass: 'bg-green-500'  },
    { label: 'Pending Send',value: stats.pending,     icon: Send,        colorClass: 'bg-indigo-500' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        description="Here's what's happening with your documents."
        action={
          <Link to="/dashboard/documents">
            <Button><FilePlus size={16} />New Document</Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Documents</h2>
          <Link to="/dashboard/documents" className="text-sm text-indigo-600 hover:underline font-medium">
            View all →
          </Link>
        </div>

        {docsLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(4)].map((_, i) => <DocumentRowSkeleton key={i} />)}
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <FileText size={36} className="text-gray-200 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No documents yet</p>
            <p className="text-gray-400 text-xs mt-1 mb-4">Upload your first document to get started</p>
            <Link to="/dashboard/documents">
              <Button size="sm"><FilePlus size={14} />Upload Document</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentDocs.map(doc => (
              <Link
                key={doc.id}
                to={`/dashboard/documents/${doc.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {doc.counts?.total_signers > 0 && (
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {doc.counts.signed_count}/{doc.counts.total_signers} signed
                    </span>
                  )}
                  <Badge className={STATUS_COLORS[doc.status]}>
                    {STATUS_LABELS[doc.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}