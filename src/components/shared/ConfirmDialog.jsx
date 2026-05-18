import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export function ConfirmDialog({
 open, onClose, onConfirm,
 title = 'Are you sure?',
 message,
 confirmLabel = 'Confirm',
 variant = 'danger',
 loading = false,
}) {
 return (
 <Modal open={open} onClose={onClose} title="" size="sm">
 <div className="text-center pt-2">
 <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
 <AlertTriangle size={32} className="text-red-500" />
 </div>
 <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight tracking-tight">{title}</h3>
 {message && <p className="text-sm font-medium text-gray-500 mb-8 max-w-[280px] mx-auto leading-relaxed">{message}</p>}
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Button variant="secondary" className="rounded-xl flex-1 py-3 font-bold order-2 sm:order-1" onClick={onClose} disabled={loading}>Cancel</Button>
 <Button variant={variant} className="rounded-xl flex-1 py-3 font-bold order-1 sm:order-2 shadow-lg shadow-red-500/10" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
 </div>
 </div>
 </Modal>
 );
}