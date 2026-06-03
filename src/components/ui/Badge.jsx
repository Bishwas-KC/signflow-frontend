import { classNames } from '@/utils/helpers';

const sizes = {
 xs: 'px-1.5 py-0.5 text-[10px]',
 sm: 'px-2 py-0.5 text-xs',
 md: 'px-2.5 py-0.5 text-xs',
};

const variantStyles = {
 default: 'bg-gray-100 text-gray-700',
 indigo: 'bg-indigo-100 text-indigo-700',
 emerald: 'bg-emerald-100 text-emerald-700',
 amber: 'bg-amber-100 text-amber-700',
 red: 'bg-red-100 text-red-700',
 gray: 'bg-gray-100 text-gray-600',
};

export function Badge({ children, className = '', size = 'md', variant = 'default' }) {
 return (
 <span className={classNames(
 'inline-flex items-center rounded-full font-bold uppercase tracking-tighter transition-all',
 sizes[size],
 variantStyles[variant] || variantStyles.default,
 className
 )}>
 {children}
 </span>
 );
}