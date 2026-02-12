import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ArtistCardSkeleton = () => (
  <Card className="overflow-hidden border-2 border-border">
    <CardContent className="p-0">
      {/* Image area */}
      <Skeleton className="aspect-square w-full rounded-none" />

      {/* Info */}
      <div className="p-3 sm:p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
