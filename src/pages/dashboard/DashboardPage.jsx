import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { documentApi } from '@/api/document.api';
import { useAuth } from '@/hooks/useAuth';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCardSkeleton, DocumentRowSkeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, classNames } from '@/utils/helpers';
import { FileText, FilePlus, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';

function StatCard({ label, value, icon: Icon, colorClass, loading }) {
  if (loading) return <StatCardSkeleton />;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-8 flex items-center gap-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass} shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-3xl font-black text-gray-900 dark:text-white leading-none mb-1.5 tracking-tight">{value ?? 0}</p>
        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Stats
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['document-stats'],
    queryFn:  documentApi.stats,
  });

  // Recent docs
  const { data: docsRes, isLoading: docsLoading } = useQuery({
    queryKey: ['recent-documents'],
    queryFn:  () => documentApi.list({ per_page: 6, sort_by: 'created_at', sort_dir: 'desc' }),
  });

  const stats    = statsRes?.data?.stats   || {};
  const recentDocs = docsRes?.data         || [];

  const statCards = [
    { label: 'Total Docs',  value: stats.total,       icon: FileText,    colorClass: 'bg-indigo-500'   },
    { label: 'In Progress', value: stats.in_progress, icon: Clock,       colorClass: 'bg-amber-500' },
    { label: 'Completed',   value: stats.completed,   icon: CheckCircle, colorClass: 'bg-emerald-500'  },
    { label: 'Drafts',      value: stats.draft,       icon: Send,        colorClass: 'bg-slate-500' },
  ];

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        description="Here's a snapshot of your document activities and signature requests."
        action={
          <Link to="/dashboard/documents">
            <Button size="lg" className="rounded-2xl shadow-xl shadow-indigo-500/20 px-8"><FilePlus size={18} />New Document</Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Recent Documents */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20">
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Recent Documents</h2>
          <Link to="/dashboard/documents" className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl transition-colors">
            View all documents
          </Link>
        </div>

        {docsLoading ? (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {[...Array(4)].map((_, i) => <DocumentRowSkeleton key={i} />)}
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 transition-transform hover:scale-110">
              <FileText size={48} className="text-gray-200 dark:text-slate-700" />
            </div>
            <p className="text-gray-900 dark:text-white font-black text-xl tracking-tight">No documents yet</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-2 mb-10 max-w-xs mx-auto font-medium">Upload your first document to start the automated signing process</p>
            <Link to="/dashboard/documents">
              <Button variant="subtle" className="rounded-2xl px-10"><FilePlus size={16} />Upload Document</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {recentDocs.map(doc => (
              <Link
                key={doc.id}
                to={`/dashboard/documents/${doc.id}`}
                className="flex items-center gap-6 px-10 py-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-indigo-500">
                  <FileText size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">{doc.title}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-black uppercase tracking-widest">{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  {doc.counts?.total_signers > 0 && (
                    <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 hidden sm:block uppercase tracking-widest">
                      {doc.counts.signed_count}/{doc.counts.total_signers} signed
                    </span>
                  )}
                  <Badge size="xs" className={classNames('px-3', STATUS_COLORS[doc.status])}>
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