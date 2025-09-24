import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'table' | 'dashboard';
  count?: number;
}

function LoadingSkeleton({ type = 'card', count = 3 }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-6 border rounded-lg space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'table':
        return (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        );
      
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 border rounded-lg space-y-3">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ))}
          </div>
        );
      
      default:
        return <Skeleton className="h-20 w-full" />;
    }
  };

  return <div className="animate-in fade-in-50">{renderSkeleton()}</div>;
}

export { Skeleton, LoadingSkeleton };

