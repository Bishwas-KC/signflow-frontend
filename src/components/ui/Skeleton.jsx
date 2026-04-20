import { classNames } from '@/utils/helpers';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={classNames('animate-pulse bg-gray-200 rounded-lg', className)}
      {...props}
    />
  );
}

export function DocumentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
      <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-48 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-3 w-16 rounded hidden lg:block" />
      <Skeleton className="h-7 w-16 rounded-lg" />
    </div>
  );
}

export function ContactCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-44 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-7 flex-1 rounded-lg" />
        <Skeleton className="h-7 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-10 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}