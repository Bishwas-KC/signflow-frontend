import { useEffect } from 'react';
import { X } from 'lucide-react';
import { classNames } from '@/utils/helpers';

const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ open, onClose, title, children, size = 'md', className = '' }) {
 useEffect(() => {
 if (open) document.body.style.overflow = 'hidden';
 return () => { document.body.style.overflow = ''; };
 }, [open]);

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose} />
 <div className={classNames(
 'relative bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col border border-gray-100 animate-slide-up',
 widths[size], className
 )}>
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
 <h2 className="text-xl font-bold text-gray-900 leading-none">{title}</h2>
 <button 
 onClick={onClose} 
  className="w-11 h-11 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
 >
 <X size={20} />
 </button>
 </div>
 {/* Body */}
 <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
 {children}
 </div>
 </div>
 </div>
 );
}