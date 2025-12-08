import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play, ChevronLeft, ChevronRight, Heart, ListPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number;
  is_free: boolean;
  price: number;
  currency: string;
  band_name: string | null;
}

interface ContentCarouselSectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  contents: Content[];
  gradientFrom: string;
  gradientTo: string;
  onContentClick: (content: Content) => void;
  onFavoriteClick: (contentId: string) => void;
  onPlaylistClick: (contentId: string) => void;
  isFavorite: (contentId: string) => boolean;
  favLoading: boolean;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ContentCarouselSection = ({
  title,
  subtitle,
  icon,
  contents,
  gradientFrom,
  gradientTo,
  onContentClick,
  onFavoriteClick,
  onPlaylistClick,
  isFavorite,
  favLoading,
}: ContentCarouselSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (contents.length === 0) return null;

  return (
    <section className="mb-12 group/section">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
          )}>
            {icon}
          </div>
          <div>
            <h2 className={cn(
              "text-2xl font-bold bg-clip-text text-transparent",
              `bg-gradient-to-r ${gradientFrom} ${gradientTo}`
            )}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {contents.map((content, index) => (
          <Card
            key={content.id}
            className={cn(
              "flex-shrink-0 w-[280px] group/card overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm",
              "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Thumbnail */}
            <div 
              className="relative overflow-hidden cursor-pointer"
              onClick={() => onContentClick(content)}
            >
              <AspectRatio ratio={16 / 9}>
                {content.thumbnail_url ? (
                  <img
                    src={content.thumbnail_url}
                    alt={content.title}
                    className="object-cover w-full h-full group-hover/card:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </AspectRatio>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all">
                <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center transform scale-75 group-hover/card:scale-100 transition-transform">
                  <Play className="w-6 h-6 text-primary-foreground" fill="currentColor" />
                </div>
              </div>

              {/* Top Badges */}
              <div className="absolute top-2 left-2 flex gap-2">
                {content.is_free ? (
                  <Badge className="bg-cyan-500/90 text-white border-none text-xs">
                    Gratis
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none text-xs">
                    ${content.price}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-background/80 hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavoriteClick(content.id);
                  }}
                  disabled={favLoading}
                >
                  {favLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart 
                      className={cn(
                        "h-4 w-4",
                        isFavorite(content.id) && "fill-red-500 text-red-500"
                      )}
                    />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-background/80 hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaylistClick(content.id);
                  }}
                >
                  <ListPlus className="h-4 w-4" />
                </Button>
              </div>

              {/* Duration */}
              {content.duration && (
                <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-none text-xs">
                  {formatDuration(content.duration)}
                </Badge>
              )}
            </div>

            {/* Content */}
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover/card:text-primary transition-colors">
                {content.title}
              </h3>
              {content.band_name && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {content.band_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {content.views_count.toLocaleString()} reproducciones
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
