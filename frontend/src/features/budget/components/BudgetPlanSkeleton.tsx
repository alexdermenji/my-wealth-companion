import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function BudgetPlanSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-[90%] mx-auto">
      {/* Year pill */}
      <div className="flex items-center justify-center shrink-0 pb-3">
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      <Card className="flex-1 min-h-0 overflow-auto">
        <CardContent className="p-0">
          {/* Allocations header row */}
          <div className="border-b bg-secondary flex px-4 py-3 gap-3 items-center">
            <Skeleton className="h-3 w-32" />
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-12 shrink-0" />
            ))}
          </div>
          {/* Remaining row */}
          <div className="border-b bg-card flex px-4 py-3 gap-3 items-center">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-12 shrink-0" />
            ))}
          </div>

          {/* Budget type sections */}
          {Array.from({ length: 4 }).map((_, si) => (
            <div key={si}>
              <div className="border-b bg-secondary flex px-4 py-2.5 items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                <Skeleton className="h-3.5 w-20" />
              </div>
              {Array.from({ length: 3 }).map((_, ri) => (
                <div key={ri} className="border-b last:border-0 flex px-4 py-2.5 gap-3 items-center">
                  <Skeleton className="h-3 w-32" />
                  {Array.from({ length: 12 }).map((_, ci) => (
                    <Skeleton key={ci} className="h-7 w-12 shrink-0 rounded" />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
