import { TableSkeleton, StatsCardSkeleton } from "../components/feedback/loading-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
      <StatsCardSkeleton />
      <TableSkeleton rows={4} />
    </div>
  );
}

