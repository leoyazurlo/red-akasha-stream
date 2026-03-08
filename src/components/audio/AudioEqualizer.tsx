import { cn } from "@/lib/utils";

interface AudioEqualizerProps {
  isPlaying: boolean;
  className?: string;
  barCount?: number;
  size?: "sm" | "md" | "lg";
}

export const AudioEqualizer = ({
  isPlaying,
  className,
  barCount = 5,
  size = "md",
}: AudioEqualizerProps) => {
  const heights = size === "sm" ? "h-3" : size === "lg" ? "h-8" : "h-5";
  const barWidth = size === "sm" ? "w-0.5" : size === "lg" ? "w-1.5" : "w-1";
  const gap = size === "sm" ? "gap-0.5" : "gap-[2px]";

  return (
    <div className={cn("flex items-end", gap, heights, className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className={cn(
            barWidth,
            "rounded-full bg-primary transition-all origin-bottom",
            isPlaying ? "animate-equalizer" : "h-1"
          )}
          style={{
            animationDelay: isPlaying ? `${i * 120}ms` : undefined,
            animationDuration: isPlaying
              ? `${400 + Math.random() * 300}ms`
              : undefined,
          }}
        />
      ))}
    </div>
  );
};
