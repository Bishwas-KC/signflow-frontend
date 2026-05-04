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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass} shadow-lg shadow-current/10`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mb-1">{value ?? 0}</p>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
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
    { label: 'Total',       value: stats.total,       icon: FileText,    colorClass: 'bg-slate-500'   },
    { label: 'In Progress', value: stats.in_progress, icon: Clock,       colorClass: 'bg-amber-500' },
    { label: 'Completed',   value: stats.completed,   icon: CheckCircle, colorClass: 'bg-emerald-500'  },
    { label: 'Pending Send',value: stats.pending,     icon: Send,        colorClass: 'bg-indigo-500' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        description="Here's a snapshot of your document activities."
        action={
          <Link to="/dashboard/documents">
            <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20"><FilePlus size={18} />New Document</Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Recent Documents */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Documents</h2>
          <Link to="/dashboard/documents" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
            View all →
          </Link>
        </div>

        {docsLoading ? (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {[...Array(4)].map((_, i) => <DocumentRowSkeleton key={i} />)}
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={40} className="text-gray-300 dark:text-slate-600" />
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-lg">No documents yet</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 mb-6 max-w-xs mx-auto">Upload your first document to start the signing process</p>
            <Link to="/dashboard/documents">
              <Button variant="secondary" className="rounded-xl"><FilePlus size={16} />Upload Document</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {recentDocs.map(doc => (
              <Link
                key={doc.id}
                to={`/dashboard/documents/${doc.id}`}
                className="flex items-center gap-4 px-8 py-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <FileText size={20} className="text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.title}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {doc.counts?.total_signers > 0 && (
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-500 hidden sm:block">
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