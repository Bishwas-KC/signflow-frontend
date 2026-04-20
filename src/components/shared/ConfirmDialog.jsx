import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

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
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-500 mb-6">{message}</p>}
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}