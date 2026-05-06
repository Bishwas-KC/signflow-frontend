import { classNames } from '@/utils/helpers';

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({ children, className = '', size = 'md' }) {
  return (
    <span className={classNames(
      'inline-flex items-center rounded-full font-bold uppercase tracking-tighter transition-all',
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}