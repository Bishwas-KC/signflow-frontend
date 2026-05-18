import { forwardRef } from 'react';
import { classNames } from '@/utils/helpers';

export const Input = forwardRef(function Input(
 { label, error, hint, className = '', ...props }, ref
) {
 return (
 <div className="space-y-1.5">
 {label && (
 <label className="block text-sm font-semibold text-gray-700 ml-0.5">{label}</label>
 )}
 <input
 ref={ref}
 {...props}
 className={classNames(
 'block w-full rounded-xl border bg-white px-4 py-2.5 text-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm',
 error
 ? 'border-red-400 focus:ring-red-400'
 : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-500/20',
 className
 )}
 />
 {error && <p className="text-xs font-medium text-red-500 mt-1 ml-0.5">{error}</p>}
 {hint && !error && <p className="text-xs text-gray-500 mt-1 ml-0.5">{hint}</p>}
 </div>
 );
});

export const Select = forwardRef(function Select(
 { label, error, children, className = '', ...props }, ref
) {
 return (
 <div className="space-y-1.5">
 {label && (
 <label className="block text-sm font-semibold text-gray-700 ml-0.5">{label}</label>
 )}
 <select
 ref={ref}
 {...props}
 className={classNames(
 'block w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-900 transition-all duration-200 shadow-sm',
 error 
 ? 'border-red-400 focus:ring-red-400' 
 : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-500/20',
 className
 )}
 >
 {children}
 </select>
 {error && <p className="text-xs font-medium text-red-500 mt-1 ml-0.5">{error}</p>}
 </div>
 );
});