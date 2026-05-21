import { Modal } from '@/components/ui/Modal';
import { ProfileContent } from '@/components/shared/ProfileContent';

export function ProfileModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" size="xl">
      <ProfileContent onSaved={onClose} />
    </Modal>
  );
}
