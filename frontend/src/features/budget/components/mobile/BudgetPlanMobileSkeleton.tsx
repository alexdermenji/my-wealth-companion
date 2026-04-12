import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function BudgetPlanMobileSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-fade-in px-4 w-full">
      {/* Year pill */}
      <div className="flex items-center justify-center shrink-0 pb-3">
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-center pb-3">
        <Skeleton className="h-10 w-48 rounded-full" />
      </div>

      {/* Remaining bar */}
      <Skeleton className="h-12 w-full rounded-xl mb-5" />

      {/* Section cards */}
      {Array.from({ length: 4 }).map((_, si) => (
        <div key={si} className="mb-5">
          {/* Section label */}
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
          {/* Card */}
          <Card className="overflow-hidden border-l-[3px] border-l-muted">
            {Array.from({ length: 3 }).map((_, ri) => (
              <div key={ri} className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-border/40 last:border-0">
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
      ))}
    </div>
  );
}
