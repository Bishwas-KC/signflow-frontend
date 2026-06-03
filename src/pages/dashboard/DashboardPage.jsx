import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { documentApi } from '@/api/document.api';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, classNames } from '@/utils/helpers';
import {
  FileText, FilePlus, CheckCircle,
  Pen, ArrowRight, TrendingUp, AlertTriangle, Bell,
} from 'lucide-react';

// ── Donut Chart ──────────────────────────────────────────

const DONUT_CONFIG = {
  draft:       { label: 'Draft',        color: '#64748b' },
  pending:     { label: 'Ready to Send', color: '#3b82f6' },
  in_progress: { label: 'In Progress',  color: '#f59e0b' },
  completed:   { label: 'Completed',    color: '#10b981' },
  cancelled:   { label: 'Cancelled',    color: '#ef4444' },
  declined:    { label: 'Declined',     color: '#ec4899' },
  expired:     { label: 'Expired',      color: '#f97316' },
};

function StatusDonut({ stats, statsLoading }) {
  const data = Object.entries(DONUT_CONFIG)
    .filter(([key]) => (stats[key] ?? 0) > 0)
    .map(([key, cfg]) => ({ name: cfg.label, value: stats[key] ?? 0, color: cfg.color, statusKey: key }));

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <div className="flex items-center justify-center h-28 text-gray-400 text-sm font-medium">No data found</div>;
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-36 h-36 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
              {data.map(entry => <Cell key={entry.statusKey} fill={entry.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 600 }}
              formatter={(value, name) => [value, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1">
        <div className="space-y-2">
          {data.map(entry => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-medium text-gray-500 flex-1">{entry.name}</span>
              <span className="text-xs font-bold text-gray-800 w-6 text-right">{entry.value}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-900 flex-1">Total</span>
            <span className="text-xs font-bold text-gray-900 w-6 text-right">{statsLoading ? '—' : total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Action Card ──────────────────────────────────────────

function ActionCard({ doc }) {
  const navigate = useNavigate();

  if (doc.can_sign_now) {
    return (
      <Link to={`/dashboard/documents/${doc.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:shadow-md transition-all group">
        <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Pen size={13} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ready for your signature</p>
          <p className="text-sm font-bold text-gray-900 truncate">{doc.title}</p>
        </div>
        <Button size="sm" className="rounded-lg bg-emerald-600 hover:bg-emerald-700 border-none text-white flex-shrink-0" onClick={e => { e.preventDefault(); navigate(`/sign/${doc.my_signing_token}/sign`); }}>
          Sign Now <ArrowRight size={14} />
        </Button>
      </Link>
    );
  }

  if (doc.cancellation_request) {
    return (
      <Link to={`/dashboard/documents/${doc.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:shadow-md transition-all group">
        <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={13} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending approval</p>
          <p className="text-sm font-bold text-gray-900 truncate">{doc.title}</p>
        </div>
        <Button size="sm" variant="secondary" className="rounded-lg flex-shrink-0" onClick={e => { e.preventDefault(); navigate(`/dashboard/documents/${doc.id}`); }}>
          Review
        </Button>
      </Link>
    );
  }

  if (doc.status === 'completed') {
    return (
      <Link to={`/dashboard/documents/${doc.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 hover:shadow-md transition-all group">
        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <CheckCircle size={13} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Recently completed</p>
          <p className="text-sm font-bold text-gray-900 truncate">{doc.title}</p>
        </div>
      </Link>
    );
  }

  return null;
}

// ── Action Center ─────────────────────────────────────────

function ActionCenter({ docs }) {
  const sections = [];

  const needsSignDocs = docs.filter(d => d.can_sign_now);
  const pendingDocs = docs.filter(d => !d.can_sign_now && d.cancellation_request);
  const completedDocs = docs.filter(d => !d.can_sign_now && !d.cancellation_request && d.status === 'completed');

  const LABEL_COLORS = { emerald: 'text-emerald-600', amber: 'text-amber-600', blue: 'text-blue-600' };

  if (needsSignDocs.length) sections.push({ label: 'Ready for you', color: 'emerald', docs: needsSignDocs });
  if (pendingDocs.length) sections.push({ label: 'Needs review', color: 'amber', docs: pendingDocs });
  if (completedDocs.length) sections.push({ label: 'Recently completed', color: 'blue', docs: completedDocs });

  if (sections.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
          <Bell size={15} className="text-emerald-500" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Action Center</h3>
      </div>
      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.label}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${LABEL_COLORS[section.color]}`}>
              {section.label}
            </p>
            {section.docs.slice(0, 3).map(doc => (
              <ActionCard key={doc.id} doc={doc} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Daily Activity Chart ────────────────────────────────

function DailyActivityChart({ activity, loading }) {
  if (loading) {
    return <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />;
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm font-medium">
        No activity data found
      </div>
    );
  }

  const formatAxisDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={activity} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            interval={4}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
            labelFormatter={(dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '4px' }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="sent" name="Sent" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={10} />
          <Bar dataKey="signed" name="Signed" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={10} />
          <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['document-stats'],
    queryFn: documentApi.stats,
  });

  const { data: docsRes, isLoading: docsLoading } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: () => documentApi.list({ per_page: 10, sort_by: 'created_at', sort_dir: 'desc' }),
  });

  const { data: activityRes, isLoading: activityLoading } = useQuery({
    queryKey: ['daily-activity'],
    queryFn: documentApi.dailyActivity,
  });

  const stats = statsRes?.data?.stats || {};
  const docs = docsRes?.data || [];
  const activity = activityRes?.data?.activity ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-8 animate-fade-in">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {greeting}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's your document overview for today.</p>
        </div>
          <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20 flex-shrink-0" onClick={() => navigate('/dashboard/documents', { state: { openNewModal: true } })}>
          <FilePlus size={18} />New Document
        </Button>
      </div>

      {/* ── Charts + Context Row ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={15} className="text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Status Overview</h3>
          </div>
          <StatusDonut stats={stats} statsLoading={statsLoading} />
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={15} className="text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Activity (Last 15 Days)</h3>
          </div>
          <DailyActivityChart activity={activity} loading={activityLoading} />
        </div>
      </div>

      <ActionCenter docs={docs} />

      {/* ── Recent Documents ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FileText size={15} className="text-indigo-500" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Recent Documents</h2>
          </div>
          <Link to="/dashboard/documents" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
            View all
          </Link>
        </div>

        {docsLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    <div className="h-2 bg-gray-50 rounded animate-pulse w-1/4" />
                  </div>
                </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-200" />
            </div>
            <p className="text-gray-900 font-bold text-lg tracking-tight">No documents found</p>
            <p className="text-gray-500 text-sm mt-1 mb-8 max-w-xs mx-auto font-medium">Upload your first document to start the automated signing process.</p>
            <Link to="/dashboard/documents">
              <Button variant="subtle" className="rounded-xl px-8"><FilePlus size={16} />New Document</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {docs.map(doc => (
              <Link
                key={doc.id}
                to={`/dashboard/documents/${doc.id}`}
                className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-all group"
              >
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-indigo-500">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{doc.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-semibold text-gray-400">{formatDate(doc.created_at)}</span>
                    {doc.counts?.total_signers > 0 && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs font-semibold text-gray-400">
                          {doc.counts.signed_count}/{doc.counts.total_signers} signed
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge size="xs" className={classNames('px-3', STATUS_COLORS[doc.status])}>
                  {STATUS_LABELS[doc.status]}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
