import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, Share2 } from "lucide-react";
import { Artist, useFollowArtist, useIsFollowing, useRateArtist, useUserRating } from "@/hooks/useArtists";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ArtistCardProps {
  artist: Artist;
  genreLabel: string;
  index: number;
}

export const ArtistCard = ({ artist, genreLabel, index }: ArtistCardProps) => {
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
      className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-elegant animate-scale-in hover-scale cursor-pointer"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <CardContent className="p-0">
        {/* Artist Image */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={artist.avatar_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop"}
            alt={`Foto de perfil de ${artist.name}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Genre Badge */}
          <Badge className="absolute top-2 md:top-3 right-2 md:right-3 bg-background/90 text-foreground hover:bg-background text-xs">
            {genreLabel}
          </Badge>

          {/* Verified Badge */}
          {artist.verified && (
            <Badge className="absolute top-2 md:top-3 left-2 md:left-3 bg-primary/90 text-primary-foreground text-xs">
              ✓ Verificado
            </Badge>
          )}

          {/* Rating Display */}
          {artist.average_rating > 0 && (
            <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{artist.average_rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({artist.total_votes})</span>
            </div>
          )}
        </div>

        {/* Artist Info */}
        <div className="p-3 md:p-4">
          <h3 className="font-semibold text-base md:text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {artist.name}
          </h3>
          
          {artist.bio && (
            <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
              {artist.bio}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
              {artist.followers_count} seguidores
            </span>
            
            {/* Action Buttons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 md:h-8 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
              >
                <Share2 className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 md:h-8 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRating(!showRating);
                }}
              >
                <Star className={`h-3 w-3 md:h-4 md:w-4 ${userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>

              <Button
                variant={isFollowing ? "default" : "ghost"}
                size="sm"
                className="h-7 md:h-8 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow();
                }}
              >
                <Heart className={`h-3 w-3 md:h-4 md:w-4 ${isFollowing ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Rating Stars */}
          {showRating && (
            <div className="flex gap-1 justify-center p-2 bg-muted/50 rounded-lg animate-fade-in">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRate(rating);
                  }}
                  className="hover:scale-125 transition-transform"
                >
                  <Star
                    className={`h-5 w-5 ${
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
