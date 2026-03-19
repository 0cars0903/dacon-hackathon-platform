import { TableSkeleton } from "@/components/common/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      <TableSkeleton rows={8} />
    </div>
  );
}
