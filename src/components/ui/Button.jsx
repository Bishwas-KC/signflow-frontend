import { classNames } from '@/utils/helpers';

const variants = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-200 dark:shadow-none',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm shadow-red-100 dark:shadow-none',
  ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  outline:   'bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500 dark:text-indigo-400 dark:border-indigo-500 dark:hover:bg-indigo-950/30',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className = '', ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={classNames(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}