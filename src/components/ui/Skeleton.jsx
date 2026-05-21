import { classNames } from '@/utils/helpers';

export function Skeleton({ className = '', ...props }) {
 return (
 <div
 className={classNames('animate-pulse bg-gray-200 rounded-lg', className)}
 {...props}
 />
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
