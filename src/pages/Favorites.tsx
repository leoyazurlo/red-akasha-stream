import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Play, Video, Loader2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";

interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  thumbnail_url: string | null;
  duration: number | null;
  is_free: boolean;
  price: number;
  currency: string;
  band_name: string | null;
}

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { favorites, toggleFavorite, isFavorite, loading: favLoading } = useFavorites();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && favorites.size > 0) {
      fetchFavoriteContents();
    } else {
      setContents([]);
      setLoading(false);
    }
  }, [user, favorites]);

  const fetchFavoriteContents = async () => {
    if (!user || favorites.size === 0) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select('id, title, description, content_type, thumbnail_url, duration, is_free, price, currency, band_name')
        .in('id', Array.from(favorites))
        .eq('status', 'approved');

      if (error) throw error;

      setContents(data || []);
    } catch (error) {
      console.error('Error fetching favorite contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (type: string) => {
    return <Video className="w-5 h-5" />;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContentClick = (contentId: string) => {
    navigate(`/video/${contentId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10">
        <Header />
        
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-10 h-10 text-primary fill-primary" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Mis Favoritos
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tu colección personalizada de videos favoritos
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tienes favoritos aún</h3>
              <p className="text-muted-foreground mb-6">
                Comienza a guardar videos que te gusten para verlos más tarde
              </p>
              <Button onClick={() => navigate('/on-demand')}>
                Explorar Contenido
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {contents.map((content) => (
                <Card 
                  key={content.id} 
                  className="group overflow-hidden border-border bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all"
                >
                  {/* Thumbnail */}
                  <div 
                    className="relative overflow-hidden bg-secondary/20 cursor-pointer"
                    onClick={() => handleContentClick(content.id)}
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
                    
                    {/* Free/Paid Badge */}
                    {content.is_free ? (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-none">
                        LIBERADO
                      </Badge>
                    ) : (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-none">
                        {content.price} {content.currency}
                      </Badge>
                    )}

                    {/* Favorite Button */}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(content.id);
                      }}
                      disabled={favLoading}
                    >
                      {favLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart 
                          className={`h-4 w-4 ${isFavorite(content.id) ? 'fill-primary text-primary' : ''}`}
                        />
                      )}
                    </Button>

                    {/* Duration Badge */}
                    {content.duration && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-none">
                        {formatDuration(content.duration)}
                      </Badge>
                    )}

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                  </div>

                  {/* Content Info */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                      {content.title}
                    </h3>
                    
                    {content.band_name && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {content.band_name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Favorites;
