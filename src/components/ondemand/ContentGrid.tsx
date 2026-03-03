import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play, Video, Music, Heart, ListPlus, Loader2, DollarSign, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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
  producer_name: string | null;
}

interface ContentGridProps {
  title: string;
  subtitle: string;
  contents: Content[];
  variant: 'free' | 'premium';
  expandedCards?: Set<string>;
  onToggleCard?: (cardId: string) => void;
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

const getContentIcon = (type: string) => {
  switch (type) {
    case 'podcast':
      return <Music className="w-5 h-5" />;
    default:
      return <Video className="w-5 h-5" />;
  }
};

export const ContentGrid = ({
  title,
  subtitle,
  contents,
  variant,
  onContentClick,
  onFavoriteClick,
  onPlaylistClick,
  isFavorite,
  favLoading,
}: ContentGridProps) => {
  const { t } = useTranslation();

  if (contents.length === 0) return null;

  const isFree = variant === 'free';

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          <span className={cn(
            "bg-clip-text text-transparent",
            isFree 
              ? "bg-gradient-to-r from-cyan-400 to-cyan-500" 
              : "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500"
          )}>
            {isFree ? "Contenido gratuito" : "Contenido premium"}
          </span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {contents.map((content, index) => (
          <div
            key={content.id}
            className={cn(
              "group rounded-lg overflow-hidden transition-all duration-300 cursor-pointer animate-scale-in",
              "border bg-card/40 backdrop-blur-sm",
              isFree 
                ? "border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_20px_hsl(180_100%_50%/0.15)]" 
                : "border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_20px_hsl(40_100%_50%/0.15)]",
              "hover:scale-[1.03]"
            )}
            style={{ animationDelay: `${Math.min(index * 40, 400)}ms`, animationFillMode: 'both' }}
            onClick={() => onContentClick(content)}
          >
            {/* Thumbnail */}
            <div className="relative overflow-hidden">
              <AspectRatio ratio={16 / 9}>
                {content.thumbnail_url ? (
                  <img
                    src={content.thumbnail_url}
                    alt={content.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/20">
                    {getContentIcon(content.content_type)}
                  </div>
                )}
              </AspectRatio>

              {/* Premium Badge */}
              {!isFree && (
                <Badge className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none flex items-center gap-1 text-[10px] px-1.5 py-0.5">
                  <DollarSign className="w-3 h-3" />
                  {content.price} {content.currency}
                </Badge>
              )}

              {/* Favorite Button */}
              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  "absolute top-1.5 right-1.5 w-8 h-8 transition-opacity bg-background/80 hover:bg-background z-20",
                  isFavorite(content.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteClick(content.id);
                }}
                disabled={favLoading}
              >
                {favLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Heart className={cn("h-3.5 w-3.5", isFavorite(content.id) && "fill-red-500 text-red-500")} />
                )}
              </Button>

              {/* Add to Playlist Button */}
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-1.5 right-10 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlaylistClick(content.id);
                }}
              >
                <ListPlus className="h-3.5 w-3.5" />
              </Button>

              {/* Duration Badge */}
              {content.duration && (
                <Badge className="absolute bottom-1.5 right-1.5 bg-black/70 text-white border-none text-[10px] px-1.5 py-0.5">
                  {formatDuration(content.duration)}
                </Badge>
              )}

              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-4 h-4 text-background ml-0.5" fill="currentColor" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-1">
              {(content.band_name || content.producer_name) && (
                <p className="text-xs font-medium text-foreground truncate">
                  {content.band_name || content.producer_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{content.title}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 pt-0.5">
                <Eye className="w-3 h-3" />
                <span>{content.views_count} reproducciones</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
