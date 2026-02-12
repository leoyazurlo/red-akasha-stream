import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        // shimmer overlay
        "after:absolute after:inset-0 after:translate-x-[-100%] after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-primary/5 after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
