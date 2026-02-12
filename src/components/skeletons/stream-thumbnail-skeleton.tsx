import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const StreamThumbnailSkeleton = () => (
  <Card className="overflow-hidden border-border">
    {/* 16:9 thumbnail */}
    <div className="relative">
      <Skeleton className="aspect-video w-full rounded-none" />
      {/* LIVE badge */}
      <Skeleton className="absolute top-2 left-2 h-5 w-12 rounded-full" />
    </div>

    {/* Meta */}
    <div className="p-3 sm:p-4 space-y-2">
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  </Card>
);
