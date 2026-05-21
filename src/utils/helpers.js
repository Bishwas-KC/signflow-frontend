export const formatFileSize = (bytes) => {
 if (!bytes) return '—';
 const units = ['B', 'KB', 'MB', 'GB'];
 let size = bytes, i = 0;
 while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
 return `${Math.round(size * 10) / 10} ${units[i]}`;
};

export const formatDate = (iso) => {
 if (!iso) return '—';
 return new Date(iso).toLocaleDateString('en-US', {
 year: 'numeric', month: 'short', day: 'numeric',
 });
};

export const formatDateTime = (iso) => {
 if (!iso) return '—';
 return new Date(iso).toLocaleString('en-US', {
 year: 'numeric', month: 'short', day: 'numeric',
 hour: '2-digit', minute: '2-digit',
 });
};

export const getInitials = (name = '') =>
 name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

export const classNames = (...classes) => classes.filter(Boolean).join(' ');
