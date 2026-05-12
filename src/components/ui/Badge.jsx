import { classNames } from '@/utils/helpers';

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
};

const variantStyles = {
  default: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400',
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