import { Skeleton } from "../ui/skeleton";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-md border border-slate-200">
        <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center">
          <Skeleton className="h-4 w-full" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-slate-100 px-4 flex items-center space-x-4 last:border-b-0"
          >
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-200 bg-white p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

