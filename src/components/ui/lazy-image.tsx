import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Music, User, ImageOff } from "lucide-react";

type FallbackIcon = "music" | "avatar" | "image";

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError" | "onLoad"> {
  src: string | null | undefined;
  alt: string;
  fallbackIcon?: FallbackIcon;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
}

const fallbackIcons: Record<FallbackIcon, typeof Music> = {
  music: Music,
  avatar: User,
  image: ImageOff,
};

export function LazyImage({
  src,
  alt,
  fallbackIcon = "image",
  width,
  height,
  className,
  containerClassName,
  ...props
}: LazyImageProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // IntersectionObserver to detect visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Start loading when visible and src is valid
  useEffect(() => {
    if (!isVisible || !src) {
      if (!src) setStatus("error");
      return;
    }
    setStatus("loading");
  }, [isVisible, src]);

  const FallbackIconComponent = fallbackIcons[fallbackIcon];

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", containerClassName)}
      style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
    >
      {/* Skeleton shimmer — visible while loading or idle */}
      {(status === "idle" || status === "loading") && (
        <div
          className="absolute inset-0 bg-muted animate-shimmer"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, hsl(var(--muted-foreground) / 0.08) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      )}

      {/* Error fallback */}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <FallbackIconComponent className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}

      {/* Actual image — rendered when visible */}
      {isVisible && src && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "transition-opacity duration-300",
            status === "loaded" ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      )}
    </div>
  );
}
