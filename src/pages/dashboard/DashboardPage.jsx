import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { documentApi } from '@/api/document.api';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, classNames } from '@/utils/helpers';
import {
  FileText, FilePlus, CheckCircle, Clock, Send,
  Pen, Users, ArrowRight, TrendingUp, AlertTriangle, Bell,
} from 'lucide-react';

// ── Animated Counter ──────────────────────────────────────

function AnimatedCounter({ value, duration = 1200 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const start = performance.now();
    let rafId;
    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * value));
      if (t < 1) rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
}

// ── Stat Card ─────────────────────────────────────────────

const CARD_STYLES = {
  total:       { gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/15', icon: FileText, label: 'Total Documents' },
  in_progress: { gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/15', icon: Clock, label: 'In Progress' },
  completed:   { gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/15', icon: CheckCircle, label: 'Completed' },
  draft:       { gradient: 'from-slate-500 to-slate-600', shadow: 'shadow-slate-500/15', icon: Send, label: 'Drafts' },
};

function StatCard({ type, value, loading, delay }) {
  const style = CARD_STYLES[type];
  const Icon = style.icon;

  if (loading) return <StatCardSkeleton />;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-default relative"
      style={{ animation: `fadeIn 0.4s ease-out ${delay}ms both` }}
    >
      <div className={`absolute top-0 left-6 right-6 h-1 rounded-full bg-gradient-to-r ${style.gradient} opacity-60`} />
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg ${style.shadow}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 tracking-tight mb-1">
        <AnimatedCounter value={value ?? 0} />
      </p>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{style.label}</p>
    </div>
  );
}

// ── Donut Chart ──────────────────────────────────────────

const DONUT_CONFIG = {
  completed:   { label: 'Completed', color: '#10b981' },
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  draft:       { label: 'Draft',       color: '#64748b' },
  cancelled:   { label: 'Cancelled',   color: '#ef4444' },
};

function StatusDonut({ stats }) {
  const data = Object.entries(DONUT_CONFIG)
    .filter(([key]) => (stats[key] ?? 0) > 0)
    .map(([key, cfg]) => ({ name: cfg.label, value: stats[key] ?? 0, color: cfg.color }));

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <div className="flex items-center justify-center h-28 text-gray-400 text-sm font-medium">No data yet</div>;
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-28 h-28 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={2} dataKey="value" stroke="none">
              {data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 600 }}
              formatter={(value, name) => [value, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5">
        {data.map(entry => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-medium text-gray-500">{entry.name}</span>
            <span className="text-xs font-bold text-gray-800 ml-auto">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick Context ─────────────────────────────────────────

function QuickContext({ needsSignature, awaitingOthers }) {
  const items = [
    { icon: Pen, label: 'Your signature needed', value: needsSignature, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconColor: 'text-emerald-500' },
    { icon: Users, label: 'Awaiting others', value: awaitingOthers, bg: 'bg-amber-50 text-amber-700 border-amber-200', iconColor: 'text-amber-500' },
  ].filter(i => i.value > 0);

  if (items.length === 0) {
    return <p className="text-sm text-gray-400 font-medium">No pending items. You're all caught up!</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {items.map(item => (
        <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${item.bg}`}>
          <item.icon size={14} className={item.iconColor} />
          <span className="text-xs font-bold">{item.label}</span>
          <span className="text-sm font-black">{item.value}</span>
        </div>
      ))}
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
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Ready for your signature</p>
          <p className="text-sm font-bold text-gray-900 truncate">{doc.title}</p>
        </div>
        <Button size="sm" className="rounded-lg bg-emerald-600 hover:bg-emerald-700 border-none text-white flex-shrink-0" onClick={e => { e.preventDefault(); navigate(`/sign/${doc.my_signing_token}/sign`); }}>
          Sign Now <ArrowRight size={14} />
        </Button>
      </Link>
    );
  }

  if (doc.cancellation_request || doc.deletion_request) {
    return (
      <Link to={`/dashboard/documents/${doc.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:shadow-md transition-all group">
        <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={13} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending approval</p>
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
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Recently completed</p>
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
  const pendingDocs = docs.filter(d => !d.can_sign_now && (d.cancellation_request || d.deletion_request));
  const completedDocs = docs.filter(d => !d.can_sign_now && !(d.cancellation_request || d.deletion_request) && d.status === 'completed');

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
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${LABEL_COLORS[section.color]}`}>
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

  const stats = statsRes?.data?.stats || {};
  const docs = docsRes?.data || [];

  const needsSignature = docs.filter(d => d.can_sign_now).length;
  const awaitingOthers = (stats.in_progress ?? 0) - needsSignature;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {greeting}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's your document overview for today.</p>
        </div>
        <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20 px-8" onClick={() => navigate('/dashboard/documents', { state: { openNewModal: true } })}>
          <FilePlus size={18} />New Document
        </Button>
      </div>

      {/* ── Stats Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {['total', 'in_progress', 'completed', 'draft'].map((type, i) => (
          <StatCard key={type} type={type} value={stats[type]} loading={statsLoading} delay={i * 80} />
        ))}
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
          <StatusDonut stats={stats} />
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Bell size={15} className="text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Quick Overview</h3>
          </div>
          {statsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <QuickContext needsSignature={needsSignature} awaitingOthers={awaitingOthers} />
          )}
        </div>
      </div>

      <ActionCenter docs={docs} />

      {/* ── Recent Documents ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
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
              <div key={i} className="flex items-center gap-4 px-6 py-4">
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
            <p className="text-gray-900 font-bold text-lg tracking-tight">No documents yet</p>
            <p className="text-gray-500 text-sm mt-1 mb-8 max-w-xs mx-auto font-medium">Upload your first document to start the automated signing process.</p>
            <Link to="/dashboard/documents">
              <Button variant="subtle" className="rounded-xl px-8"><FilePlus size={16} />Upload Document</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {docs.map(doc => (
              <Link
                key={doc.id}
                to={`/dashboard/documents/${doc.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-all group"
              >
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-indigo-500">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{doc.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-semibold text-gray-400">{formatDate(doc.created_at)}</span>
                    {doc.counts?.total_signers > 0 && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-[10px] font-semibold text-gray-400">
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
