import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, Share2 } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { Artist, useFollowArtist, useIsFollowing, useRateArtist, useUserRating } from "@/hooks/useArtists";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ArtistCardProps {
  artist: Artist;
  genreLabel: string;
  index: number;
}

export const ArtistCard = ({ artist, genreLabel, index }: ArtistCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: isFollowing = false } = useIsFollowing(artist.id);
  const { data: userRating } = useUserRating(artist.id);
  const followMutation = useFollowArtist();
  const rateMutation = useRateArtist();
  const [showRating, setShowRating] = useState(false);

  const handleFollow = () => {
    followMutation.mutate({ artistId: artist.id, isFollowing });
  };

  const handleRate = (rating: number) => {
    rateMutation.mutate({ artistId: artist.id, rating });
    setShowRating(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/artistas/${artist.id}`;
    if (navigator.share) {
      navigator.share({
        title: artist.name,
        text: `Descubre a ${artist.name} en Red Akasha`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace del artista se copió al portapapeles",
      });
    }
  };

  return (
    <Card
      data-index={index}
      className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-elegant hover-scale cursor-pointer opacity-0 animate-fade-in"
      style={{ 
        animationDelay: `${index * 75}ms`,
        animationFillMode: 'forwards'
      }}
      onClick={() => navigate(`/artistas/${artist.id}`)}
    >
      <CardContent className="p-0">
        {/* Artist Image */}
        <div className="relative aspect-square overflow-hidden">
          <LazyImage
            src={artist.avatar_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop"}
            alt={`Foto de perfil de ${artist.name}`}
            fallbackIcon="avatar"
            width={400}
            height={400}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            containerClassName="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Genre Badge - Responsive positioning */}
          <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-background/90 text-foreground hover:bg-background text-[10px] sm:text-xs px-2 py-0.5">
            {genreLabel}
          </Badge>

          {/* Verified Badge - Responsive */}
          {artist.verified && (
            <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-primary/90 text-primary-foreground text-[10px] sm:text-xs px-2 py-0.5">
              ✓ Verificado
            </Badge>
          )}

          {/* Rating Display - Responsive */}
          {artist.average_rating > 0 && (
            <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{artist.average_rating.toFixed(1)}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">({artist.total_votes})</span>
            </div>
          )}
        </div>

        {/* Artist Info - Better mobile spacing */}
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {artist.name}
          </h3>
          
          {artist.bio && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
              {artist.bio}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {artist.followers_count} seguidores
            </span>
            
            {/* Action Buttons - Better touch targets */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRating(!showRating);
                }}
              >
                <Star className={`h-4 w-4 ${userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>

              <Button
                variant={isFollowing ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow();
                }}
              >
                <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Rating Stars - Better mobile layout */}
          {showRating && (
            <div className="flex gap-1 sm:gap-1.5 justify-center p-2 bg-muted/50 rounded-lg animate-fade-in">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRate(rating);
                  }}
                  className="hover:scale-125 transition-transform p-1"
                >
                  <Star
                    className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      userRating && rating <= userRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
