import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SettingsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* General settings */}
      <Card>
        <CardHeader><Skeleton className="h-5 w-20" /></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b flex px-4 py-3 gap-4">
            {[140, 100, 64].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-b last:border-0 flex px-4 py-3.5 gap-4 items-center">
              <Skeleton className="h-4 w-36 flex-1" />
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
