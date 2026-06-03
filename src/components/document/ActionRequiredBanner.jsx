import { Button } from '@/components/ui/Button';
import { Pen, Clock, Users, Shield, ArrowRight } from 'lucide-react';

export function ActionRequiredBanner({ doc, signers, currentSigner, isSignable, onSign }) {
  if (doc.status === 'cancelled') return null;
  if (doc.status === 'draft' || doc.status === 'pending') return null;

  const signedCount = doc.counts?.signed_count || 0;
  const totalSigners = doc.counts?.total_signers || 0;
  const isSigner = doc.role === 'signer';
  const hasDeclined = currentSigner?.status === 'declined';

  // Document declined — show banner for declining signer, hide for everyone else
  if (doc.status === 'declined') {
    if (isSigner && hasDeclined) {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-rose-100">
            <Clock size={20} className="text-rose-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-900">You have declined to sign this document.</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Sequential turn indicator
  if (doc.signing_mode === 'sequential' && doc.current_signer && !isSignable) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-50/50 border border-indigo-200/70 rounded-xl px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-100">
          <Shield size={20} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-900">
            <span className="font-bold">{doc.current_signer.name}</span>
            <span className="text-indigo-600"> is next in the signing order</span>
          </p>
          <p className="text-xs text-indigo-500 mt-0.5">
            Turn {doc.current_signing_order} of {signers?.length || 0}
            {isSigner && currentSigner?.status !== 'signed' && currentSigner?.status !== 'declined' && '. You will be notified when it is your turn.'}
          </p>
        </div>
      </div>
    );
  }

  // Signer needs to sign
  if (isSigner && isSignable) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/40 border border-emerald-200/70 rounded-xl px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-100">
          <Pen size={20} className="text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900">Your signature is required</p>
          <p className="text-xs text-emerald-600 mt-0.5">Review the document and sign with OTP verification.</p>
        </div>
        <Button size="md" className="rounded-xl flex-shrink-0 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white border-none" onClick={onSign}>
          <Pen size={15} /> Sign Now
          <ArrowRight size={15} />
        </Button>
      </div>
    );
  }

  // Owner progress
  if (doc.role === 'owner') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-blue-50/40 border border-blue-200/70 rounded-xl px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
          <Users size={20} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900">
            {signedCount} of {totalSigners} signers completed
          </p>
          <p className="text-xs text-blue-500 mt-0.5">
            {doc.current_signer
              ? `Current signer: ${doc.current_signer.name}`
              : 'Awaiting signatures.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
