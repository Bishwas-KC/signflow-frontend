import { Shield, KeyRound, Fingerprint, FileCheck } from 'lucide-react';

const features = [
 { label: 'OTP Protected', icon: KeyRound, enabled: true },
 { label: 'Audit Trail', icon: Fingerprint, enabled: true },
 { label: 'Tamper-Evident Seal', icon: FileCheck, enabled: true },
];

export function SecurityCard() {
 return (
 <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
 <div className="flex items-center gap-2 mb-4">
 <Shield size={16} className="text-indigo-500" />
 <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Security</h3>
 </div>
 <div className="space-y-3">
 {features.map((f, i) => (
 <div key={i} className="flex items-center gap-3">
 <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
 <f.icon size={14} className="text-green-600" />
 </div>
 <span className="text-sm text-gray-700">{f.label}</span>
 <span className="ml-auto text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
 Enabled
 </span>
 </div>
 ))}
 </div>
 </section>
 );
}
