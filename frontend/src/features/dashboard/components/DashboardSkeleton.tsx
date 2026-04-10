import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function MobileSkeleton() {
  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.25) 0%, hsl(var(--primary) / 0.15) 100%)' }}>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </div>

      {/* Pill tabs */}
      <Skeleton className="h-11 w-full rounded-full" />

      {/* Category panel */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="h-5 w-20 ml-auto" />
              <Skeleton className="h-3 w-28 ml-auto" />
            </div>
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <CardContent className="p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              <div className="space-y-1 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-3 w-12 ml-auto" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function DesktopSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Left nav cards */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-11 w-11 rounded-full" />
              </div>
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* Right detail card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <div className="flex gap-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b bg-secondary flex px-4 py-2.5 gap-4">
              {[120, 80, 80, 160, 80, 80].map((w, i) => (
                <Skeleton key={i} className="h-3" style={{ width: w }} />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-b last:border-0 flex px-4 py-3 gap-4 items-center">
                {[120, 80, 80, 160, 80, 80].map((w, j) => (
                  <Skeleton key={j} className="h-4" style={{ width: w }} />
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <div className="sm:hidden"><MobileSkeleton /></div>
      <div className="hidden sm:block"><DesktopSkeleton /></div>
    </>
  );
}
