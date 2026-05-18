import { Calendar, User, Building, Clock, Hash, Shield } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export function MetadataCard({ doc }) {
  const items = [
    { label: 'Created', value: formatDate(doc.created_at), icon: Calendar },
    { label: 'Owner', value: doc.user?.name || '—', icon: User },
    { label: 'Company', value: doc.company?.name || 'Personal', icon: Building },
    { label: 'Expires', value: doc.expires_at ? formatDate(doc.expires_at) : 'Never', icon: Clock },
    { label: 'Signing Mode', value: doc.signing_mode === 'sequential' ? 'Sequential (in order)' : 'Bulk (any order)', icon: Hash },
    { label: 'File Size', value: doc.file?.size_formatted || '—', icon: Shield },
  ];

  return (
    <section className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-5">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Details</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <item.icon size={14} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 flex-1">{item.label}</span>
            <span className="text-xs font-semibold text-gray-900 text-right truncate max-w-[160px]">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
