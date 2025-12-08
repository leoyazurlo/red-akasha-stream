import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Play, Video, Music, Heart, ListPlus, Info, ChevronDown, ChevronUp, Loader2, DollarSign } from "lucide-react";
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
  expandedCards: Set<string>;
  onToggleCard: (cardId: string) => void;
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
    case 'video_musical_vivo':
    case 'video_clip':
    case 'corto':
    case 'documental':
    case 'pelicula':
      return <Video className="w-5 h-5" />;
    case 'podcast':
      return <Music className="w-5 h-5" />;
    default:
      return <Play className="w-5 h-5" />;
  }
};

export const ContentGrid = ({
  title,
  subtitle,
  contents,
  variant,
  expandedCards,
  onToggleCard,
  onContentClick,
  onFavoriteClick,
  onPlaylistClick,
  isFavorite,
  favLoading,
}: ContentGridProps) => {
  const { t } = useTranslation();

  if (contents.length === 0) return null;

  const isFree = variant === 'free';
  const accentColor = isFree ? 'cyan' : 'amber';

  return (
    <section className="mb-12">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "h-10 w-1 rounded-full",
            isFree 
              ? "bg-gradient-to-b from-cyan-500 to-cyan-600" 
              : "bg-gradient-to-b from-amber-500 via-yellow-500 to-orange-500"
          )} />
          <h2 className={cn(
            "text-3xl font-bold bg-clip-text text-transparent",
            isFree 
              ? "bg-gradient-to-r from-cyan-400 to-cyan-500" 
              : "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500"
          )}>
            {title}
          </h2>
        </div>
        <p className="text-muted-foreground ml-7">{subtitle}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {contents.map((content, index) => {
          const cardId = `${variant}-${content.id}`;
          const isExpanded = expandedCards.has(cardId);
          
          return (
            <Card 
              key={content.id} 
              className={cn(
                "group overflow-hidden transition-all duration-300 animate-fade-in",
                isFree 
                  ? "border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-500/5 to-cyan-600/5 backdrop-blur-sm hover:from-cyan-500/10 hover:to-cyan-600/10 hover:border-cyan-500/60"
                  : "border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 backdrop-blur-sm hover:from-amber-500/15 hover:via-yellow-500/10 hover:to-orange-500/15 hover:border-amber-500/60"
              )}
              style={{
                boxShadow: isFree 
                  ? '0 0 15px rgba(6, 182, 212, 0.25)' 
                  : '0 0 15px rgba(245, 158, 11, 0.25)',
                animationDelay: `${index * 0.05}s`
              }}
            >
              {/* Premium Shine Effect */}
              {!isFree && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              )}
              
              {/* Thumbnail */}
              <div 
                className="relative overflow-hidden bg-secondary/20 cursor-pointer m-1 rounded-md"
                onClick={() => onContentClick(content)}
              >
                <AspectRatio ratio={16 / 9}>
                  {content.thumbnail_url ? (
                    <img
                      src={content.thumbnail_url}
                      alt={content.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                      {getContentIcon(content.content_type)}
                    </div>
                  )}
                </AspectRatio>

                {/* Premium Badge */}
                {!isFree && (
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none flex items-center gap-1 shadow-lg shadow-amber-500/50">
                    <DollarSign className="w-3 h-3" />
                    {content.price} {content.currency}
                  </Badge>
                )}

                {/* Favorite Button */}
                <Button
                  size="icon"
                  variant="secondary"
                  className={cn(
                    "absolute top-2 right-2 transition-opacity bg-background/80 hover:bg-background z-20",
                    isFavorite(content.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
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

                {/* Add to Playlist Button */}
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaylistClick(content.id);
                  }}
                >
                  <ListPlus className="h-4 w-4" />
                </Button>

                {/* Duration Badge */}
                {content.duration && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-none">
                    {formatDuration(content.duration)}
                  </Badge>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
                  <Play className="w-12 h-12 text-white" fill="white" />
                </div>
              </div>

              {/* Title */}
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
              </CardHeader>

              {/* Collapsible Content */}
              <CardContent className="p-4 pt-0">
                <Collapsible 
                  open={isExpanded}
                  onOpenChange={() => onToggleCard(cardId)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full flex items-center justify-center gap-2 text-xs",
                        isFree 
                          ? "text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10" 
                          : "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                      )}
                    >
                      <Info className="w-3 h-3" />
                      {isExpanded ? "Ver menos" : "Ver más información"}
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-3 space-y-3 animate-accordion-down">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "w-fit",
                        isFree ? "border-cyan-500 text-cyan-500" : "border-amber-500 text-amber-500"
                      )}
                    >
                      {t(`onDemand.types.${content.content_type}`, content.content_type)}
                    </Badge>
                    
                    {content.description && (
                      <CardDescription className="text-sm">
                        {content.description}
                      </CardDescription>
                    )}

                    <div className={cn(
                      "space-y-1 text-xs text-muted-foreground pt-2 border-t",
                      isFree ? "border-cyan-500/20" : "border-amber-500/20"
                    )}>
                      {content.band_name && (
                        <p>Banda: {content.band_name}</p>
                      )}
                      {content.producer_name && (
                        <p>Productor: {content.producer_name}</p>
                      )}
                      <p className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {content.views_count} reproducciones
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
