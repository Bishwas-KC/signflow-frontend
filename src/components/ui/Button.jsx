import { classNames } from '@/utils/helpers';

const variants = {
 primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-200',
 secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-indigo-500 shadow-sm',
 danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm shadow-red-100',
 ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
 outline: 'bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
 subtle: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs min-h-[44px]',
  sm: 'px-3 py-1.5 text-sm min-h-[44px]',
  md: 'px-4 py-2 text-sm min-h-[44px]',
  lg: 'px-6 py-2.5 text-base min-h-[44px]',
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
 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
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