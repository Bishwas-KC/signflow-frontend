import { classNames } from '@/utils/helpers';

export function Badge({ children, className = '' }) {
  return (
    <span className={classNames(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      className
    )}>
      {children}
    </span>
  );
}