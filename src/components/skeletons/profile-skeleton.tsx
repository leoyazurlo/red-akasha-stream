import { Skeleton } from "@/components/ui/skeleton";

export const ProfileSkeleton = () => (
  <div className="space-y-6">
    {/* Cover image */}
    <Skeleton className="h-48 sm:h-64 w-full rounded-none" />

    {/* Avatar + name area */}
    <div className="container mx-auto px-4 max-w-6xl -mt-16 relative z-10 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
      <Skeleton className="h-28 w-28 rounded-full border-4 border-background shrink-0" />
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <Skeleton className="h-7 w-48 mx-auto sm:mx-0" />
        <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </div>

    {/* Bio lines */}
    <div className="container mx-auto px-4 max-w-6xl space-y-2">
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-3/4 max-w-sm" />
    </div>

    {/* Content grid */}
    <div className="container mx-auto px-4 max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full" />
      ))}
    </div>
  </div>
);
