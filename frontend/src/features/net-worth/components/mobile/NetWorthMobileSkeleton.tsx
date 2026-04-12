import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function NetWorthMobileSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-fade-in w-full">
      <div className="flex items-center justify-center pb-3">
        <Skeleton className="h-10 w-48 rounded-full" />
      </div>

      <Skeleton className="h-16 w-full rounded-xl mb-4" />

      <div className="flex gap-1.5 bg-card border border-border rounded-full p-1 shadow-sm mb-5">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-9 flex-1 rounded-full" />
        ))}
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-14" />
        </div>
        <Card className="overflow-hidden border-l-[3px] border-l-muted">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-border/40 last:border-0">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-3.5 w-28" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
          <div className="px-4 py-3 border-t border-border/40">
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </Card>
      </div>
    </div>
  );
}
