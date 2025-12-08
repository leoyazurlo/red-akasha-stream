import { Play, Star, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface RankingVideo {
  id: string;
  rank?: number;
  thumbnail_url: string | null;
  title: string;
  band_name: string | null;
  content_type: string;
  likes_count: number;
  uploader_id: string;
  country?: string | null;
}

interface VideoRankingProps {
  videos?: RankingVideo[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  'Argentina': '🇦🇷',
  'Bolivia': '🇧🇴',
  'Brasil': '🇧🇷',
  'Brazil': '🇧🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Costa Rica': '🇨🇷',
  'Cuba': '🇨🇺',
  'Ecuador': '🇪🇨',
  'El Salvador': '🇸🇻',
  'España': '🇪🇸',
  'Spain': '🇪🇸',
  'Estados Unidos': '🇺🇸',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Guatemala': '🇬🇹',
  'Honduras': '🇭🇳',
  'México': '🇲🇽',
  'Mexico': '🇲🇽',
  'Nicaragua': '🇳🇮',
  'Panamá': '🇵🇦',
  'Panama': '🇵🇦',
  'Paraguay': '🇵🇾',
  'Perú': '🇵🇪',
  'Peru': '🇵🇪',
  'Puerto Rico': '🇵🇷',
  'República Dominicana': '🇩🇴',
  'Dominican Republic': '🇩🇴',
  'Uruguay': '🇺🇾',
  'Venezuela': '🇻🇪',
  'Alemania': '🇩🇪',
  'Germany': '🇩🇪',
  'Francia': '🇫🇷',
  'France': '🇫🇷',
  'Italia': '🇮🇹',
  'Italy': '🇮🇹',
  'Portugal': '🇵🇹',
  'Reino Unido': '🇬🇧',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Canadá': '🇨🇦',
  'Canada': '🇨🇦',
  'China': '🇨🇳',
  'Japón': '🇯🇵',
  'Japan': '🇯🇵',
  'Corea del Sur': '🇰🇷',
  'South Korea': '🇰🇷',
  'Rusia': '🇷🇺',
  'Russia': '🇷🇺',
};

const getCountryFlag = (country: string | null | undefined): string => {
  if (!country) return '🌎';
  return COUNTRY_FLAGS[country] || '🌎';
};

const CATEGORIES = [
  { key: 'all', label: 'ranking.all', types: [] as string[] },
  { key: 'video_clip', label: 'ranking.videoClip', types: ['video_clip'] },
  { key: 'video_musical_vivo', label: 'ranking.liveMusic', types: ['video_musical_vivo'] },
  { key: 'podcast', label: 'ranking.podcast', types: ['podcast'] },
  { key: 'documental', label: 'ranking.documentary', types: ['documental'] },
  { key: 'corto', label: 'ranking.short', types: ['corto'] },
  { key: 'pelicula', label: 'ranking.movie', types: ['pelicula'] },
];

export const VideoRanking = ({ videos: propVideos }: VideoRankingProps) => {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<RankingVideo[]>(propVideos || []);
  const [loading, setLoading] = useState(!propVideos);
  const [activeCategory, setActiveCategory] = useState('all');
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
      // First get the content
      const { data: contentData, error: contentError } = await supabase
        .from('content_uploads')
        .select('id, title, thumbnail_url, band_name, content_type, likes_count, uploader_id')
        .eq('status', 'approved')
        .order('likes_count', { ascending: false })
        .limit(100);

      if (contentError) throw contentError;

      if (!contentData || contentData.length === 0) {
        setVideos([]);
        return;
      }

      // Get unique uploader IDs
      const uploaderIds = [...new Set(contentData.map(v => v.uploader_id))];

      // Fetch countries from profile_details
      const { data: profilesData } = await supabase
        .from('profile_details')
        .select('user_id, pais')
        .in('user_id', uploaderIds);

      // Create a map of user_id to country
      const countryMap: Record<string, string> = {};
      profilesData?.forEach(p => {
        if (p.pais) countryMap[p.user_id] = p.pais;
      });

      // Merge country data into videos
      const videosWithCountry = contentData.map(video => ({
        ...video,
        country: countryMap[video.uploader_id] || null
      }));

      setVideos(videosWithCountry);
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredVideos = () => {
    const category = CATEGORIES.find(c => c.key === activeCategory);
    if (!category || category.types.length === 0) {
      return videos.map((video, index) => ({ ...video, rank: index + 1 }));
    }
    return videos
      .filter(v => category.types.includes(v.content_type))
      .map((video, index) => ({ ...video, rank: index + 1 }));
  };

  const handleRating = async (videoId: string, rating: number) => {
    if (!user) {
      toast({
        title: t('ranking.loginRequired'),
        description: t('ranking.loginToRate'),
        variant: "destructive",
      });
      return;
    }

    setUserRatings(prev => ({ ...prev, [videoId]: rating }));

    try {
      const { error: likeError } = await supabase
        .from('content_likes')
        .upsert({
          content_id: videoId,
          user_id: user.id,
        }, {
          onConflict: 'user_id,content_id'
        });

      if (likeError) throw likeError;

      setVideos(prev => 
        prev.map(v => 
          v.id === videoId 
            ? { ...v, likes_count: v.likes_count + 1 }
            : v
        )
      );

      toast({
        title: t('ranking.ratingSaved'),
        description: t('ranking.ratingRegistered'),
      });
    } catch (error) {
      console.error('Error rating video:', error);
      toast({
        title: t('common.error'),
        description: t('ranking.ratingError'),
        variant: "destructive",
      });
    }
  };

  const filteredVideos = getFilteredVideos();

  if (loading) {
    return (
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-2 sm:px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            {t('ranking.title')}
          </h2>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {t('ranking.subtitle')}
          </p>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-1 mb-6 bg-transparent h-auto">
            {CATEGORIES.map((cat) => (
              <TabsTrigger 
                key={cat.key} 
                value={cat.key}
                className="px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
              >
                {t(cat.label)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-0">
            {filteredVideos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('ranking.noContent')}
              </p>
            ) : (
              <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
                {filteredVideos.map((video, index) => (
                  <Card 
                    key={video.id} 
                    data-index={index}
                    className="p-3 sm:p-4 hover:shadow-glow transition-all duration-500 backdrop-blur-sm bg-card/50 hover:scale-[1.02]"
                  >
                    <div className="flex gap-2 sm:gap-4">
                      <div className="flex items-center justify-center w-6 sm:w-8 shrink-0">
                        <span className="text-xl sm:text-2xl font-light text-primary">
                          {video.rank}
                        </span>
                      </div>

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
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/90 rounded-full flex items-center justify-center">
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground truncate">
                            {video.band_name || video.title}
                          </h3>
                          <p className="text-xs sm:text-sm font-light text-muted-foreground truncate capitalize">
                            {t(`ranking.types.${video.content_type}`, video.content_type.replace(/_/g, ' '))}
                          </p>
                        </div>

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
                          <span className="text-xs sm:text-sm font-light text-muted-foreground flex items-center gap-1">
                            {video.likes_count} {video.likes_count === 1 ? t('ranking.vote') : t('ranking.votes')}
                            <span className="text-base ml-1" title={video.country || undefined}>
                              {getCountryFlag(video.country)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
