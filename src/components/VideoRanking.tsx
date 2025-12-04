import { Play, Star, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface RankingVideo {
  id: string;
  rank: number;
  thumbnail_url: string | null;
  title: string;
  band_name: string | null;
  content_type: string;
  likes_count: number;
  uploader_id: string;
}

interface VideoRankingProps {
  videos?: RankingVideo[];
}

const countryFlags: Record<string, string> = {
  'Argentina': '🇦🇷',
  'Bolivia': '🇧🇴',
  'Brasil': '🇧🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'México': '🇲🇽',
  'Perú': '🇵🇪',
  'Uruguay': '🇺🇾',
  'Venezuela': '🇻🇪',
};

export const VideoRanking = ({ videos: propVideos }: VideoRankingProps) => {
  const [videos, setVideos] = useState<RankingVideo[]>(propVideos || []);
  const [loading, setLoading] = useState(!propVideos);
  const [userRatings, setUserRatings] = useState<{ [key: string]: number }>({});
  const { elementRef } = useScrollAnimation({ threshold: 0.1 });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!propVideos) {
      fetchRankingVideos();
    }
  }, [propVideos]);

  const fetchRankingVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select('id, title, thumbnail_url, band_name, content_type, likes_count, uploader_id')
        .eq('status', 'approved')
        .in('content_type', ['video_musical_vivo', 'video_clip'])
        .order('likes_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Agregar rank a cada video
      const rankedVideos = (data || []).map((video, index) => ({
        ...video,
        rank: index + 1,
      }));

      setVideos(rankedVideos);
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (videoId: string, rating: number) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para calificar videos",
        variant: "destructive",
      });
      return;
    }

    setUserRatings(prev => ({ ...prev, [videoId]: rating }));

    try {
      // Agregar o actualizar like
      const { error: likeError } = await supabase
        .from('content_likes')
        .upsert({
          content_id: videoId,
          user_id: user.id,
        }, {
          onConflict: 'user_id,content_id'
        });

      if (likeError) throw likeError;

      // Actualizar contador local
      setVideos(prev => 
        prev.map(v => 
          v.id === videoId 
            ? { ...v, likes_count: v.likes_count + 1 }
            : v
        )
      );

      toast({
        title: "¡Valoración guardada!",
        description: "Tu calificación ha sido registrada",
      });
    } catch (error) {
      console.error('Error rating video:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu valoración",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-2 sm:px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-center mb-6">
            Rankings de Videos
          </h2>
          <p className="text-center text-muted-foreground">
            Aún no hay videos rankeados. ¡Sé el primero en subir contenido!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      ref={elementRef}
      className="py-8 md:py-12"
      id="ranking"
    >
      <div className="container mx-auto px-2 sm:px-4">
        <div className="relative mb-6 md:mb-8">
          <div className="absolute inset-0 bg-gradient-glow opacity-20 blur-3xl" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-poppins font-medium tracking-wide text-foreground text-center relative px-4">
            Rankings de Videos
          </h2>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Los videos más votados por la comunidad
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
          {videos.map((video, index) => (
            <Card 
              key={video.id} 
              data-index={index}
              className="p-3 sm:p-4 hover:shadow-glow transition-all duration-500 backdrop-blur-sm bg-card/50 hover:scale-[1.02]"
            >
              <div className="flex gap-2 sm:gap-4">
                {/* Rank Number */}
                <div className="flex items-center justify-center w-6 sm:w-8 shrink-0">
                  <span className="text-xl sm:text-2xl font-light text-primary">
                    {video.rank}
                  </span>
                </div>

                {/* Video Thumbnail */}
                <div 
                  className="relative w-24 sm:w-32 md:w-40 aspect-video shrink-0 rounded-md sm:rounded-lg overflow-hidden bg-card border border-border group cursor-pointer"
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/90 rounded-full flex items-center justify-center group-hover:animate-float">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground truncate">
                      {video.band_name || video.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-light text-muted-foreground truncate capitalize">
                      {video.content_type.replace('_', ' ')}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
                    <div className="flex gap-0.5 sm:gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-transparent hover:scale-125 transition-transform duration-200"
                          onClick={() => handleRating(video.id, star)}
                        >
                          <Star
                            className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 ${
                              star <= (userRatings[video.id] || 0)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm font-light text-muted-foreground">
                      {video.likes_count} {video.likes_count === 1 ? 'voto' : 'votos'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
