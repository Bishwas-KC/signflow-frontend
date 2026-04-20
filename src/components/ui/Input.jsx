import { forwardRef } from 'react';
import { classNames } from '@/utils/helpers';

export const Input = forwardRef(function Input(
  { label, error, hint, className = '', ...props }, ref
) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        className={classNames(
          'block w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:border-indigo-400',
          className
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, children, className = '', ...props }, ref
) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <select
        ref={ref}
        {...props}
        className={classNames(
          'block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition',
          error ? 'border-red-400' : 'border-gray-300',
          className
        )}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});