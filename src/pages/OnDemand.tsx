import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import { Play, Search, Loader2, TrendingUp, Clock, Sparkles, Flame } from "lucide-react";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroCarousel } from "@/components/ondemand/HeroCarousel";
import { ContentCarouselSection } from "@/components/ondemand/ContentCarouselSection";
import { CategoryFilter } from "@/components/ondemand/CategoryFilter";
import { ContentGrid } from "@/components/ondemand/ContentGrid";

interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: 'video_musical_vivo' | 'video_clip' | 'podcast' | 'corto' | 'documental' | 'pelicula';
  thumbnail_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  photo_url: string | null;
  duration: number | null;
  views_count: number;
  is_free: boolean;
  price: number;
  currency: string;
  created_at: string;
  uploader_id: string;
  band_name: string | null;
  producer_name: string | null;
  venue_name: string | null;
  promoter_name: string | null;
}

interface PlaybackHistory {
  id: string;
  content_id: string;
  last_position: number;
  duration: number;
  completed: boolean;
  last_watched_at: string;
  content?: Content;
}

const OnDemand = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);
  const [continueWatching, setContinueWatching] = useState<PlaybackHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const { toast } = useToast();
  const { toggleFavorite, isFavorite, loading: favLoading } = useFavorites();

  const toggleCardInfo = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    checkUserProfile();
  }, []);

  useEffect(() => {
    if (hasProfile) {
      fetchContents();
      if (user) {
        fetchContinueWatching();
      }
    }
  }, [user, hasProfile]);

  const checkUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('profile_details')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setHasProfile(false);
      } else {
        setHasProfile(true);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const fetchContents = async () => {
    try {
      let query = supabase
        .from('content_uploads')
        .select('*')
        .in('content_type', ['video_musical_vivo', 'video_clip', 'podcast', 'corto', 'documental', 'pelicula'])
        .order('created_at', { ascending: false });

      if (user) {
        query = query.or(`status.eq.approved,and(status.eq.pending,uploader_id.eq.${user.id})`);
      } else {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query;

      if (error) throw error;

      setContents(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: t('common.error'),
        description: t('onDemand.errorLoadingContent'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContinueWatching = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('playback_history')
        .select(`
          *,
          content:content_uploads(*)
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('last_watched_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const validHistory = (data || [])
        .filter(item => item.content && item.last_position > 30)
        .map(item => ({
          ...item,
          content: Array.isArray(item.content) ? item.content[0] : item.content
        }));

      setContinueWatching(validHistory);
    } catch (error) {
      console.error('Error fetching continue watching:', error);
    }
  };

  // Filtered and categorized content
  const filteredContents = useMemo(() => {
    let filtered = [...contents];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(content => 
        content.title.toLowerCase().includes(term) ||
        content.description?.toLowerCase().includes(term) ||
        content.band_name?.toLowerCase().includes(term) ||
        content.producer_name?.toLowerCase().includes(term)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(content => content.content_type === filterType);
    }

    return filtered;
  }, [contents, searchTerm, filterType]);

  // Content counts for category filter
  const categoryCounts = useMemo(() => {
    const countByType = (type: string) => 
      type === "all" 
        ? contents.length 
        : contents.filter(c => c.content_type === type).length;

    return {
      all: contents.length,
      video_musical_vivo: countByType('video_musical_vivo'),
      video_clip: countByType('video_clip'),
      podcast: countByType('podcast'),
      corto: countByType('corto'),
      documental: countByType('documental'),
      pelicula: countByType('pelicula'),
    };
  }, [contents]);

  // Smart sections
  const trendingContents = useMemo(() => 
    [...contents].sort((a, b) => b.views_count - a.views_count).slice(0, 10),
    [contents]
  );

  const newContents = useMemo(() => 
    [...contents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10),
    [contents]
  );

  const freeContents = useMemo(() => 
    filteredContents.filter(c => c.is_free),
    [filteredContents]
  );

  const paidContents = useMemo(() => 
    filteredContents.filter(c => !c.is_free),
    [filteredContents]
  );

  const handleContentClick = (content: Content) => {
    navigate(`/video/${content.id}`);
  };

  const handleContinueWatching = (history: PlaybackHistory) => {
    if (!history.content) return;
    navigate(`/video/${history.content.id}`);
  };

  const handleFavoriteClick = (contentId: string) => {
    toggleFavorite(contentId);
  };

  const handlePlaylistClick = (contentId: string) => {
    setSelectedContentId(contentId);
    setShowAddToPlaylist(true);
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="relative z-10">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="relative z-10">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4">
              <Card className="max-w-2xl mx-auto border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">{t('onDemand.joinRequired')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mt-6 flex gap-4">
                    <Button onClick={() => navigate("/asociate")} className="flex-1">
                      {t('onDemand.joinNow')}
                    </Button>
                    <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                      {t('common.goBack')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10">
        <Header />
        
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Hero Carousel */}
          {!loading && contents.length > 0 && (
            <HeroCarousel 
              contents={contents} 
              onContentClick={handleContentClick}
            />
          )}

          {/* Continue Watching Section */}
          {user && continueWatching.length > 0 && (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t('onDemand.continueWatching')}</CardTitle>
                    <CardDescription>{t('onDemand.resumeWhere')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {continueWatching.map((history, index) => {
                    const content = history.content as Content;
                    if (!content) return null;
                    
                    const progress = (history.last_position / history.duration) * 100;
                    
                    return (
                      <Card 
                        key={history.id}
                        className="group overflow-hidden border-border bg-card/30 hover:bg-card/60 transition-all cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => handleContinueWatching(history)}
                      >
                        <div className="relative overflow-hidden">
                          <AspectRatio ratio={16 / 9}>
                            {content.thumbnail_url ? (
                              <img
                                src={content.thumbnail_url}
                                alt={content.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                                <Play className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </AspectRatio>
                          
                          {/* Progress Bar */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                              <Play className="w-6 h-6 text-primary-foreground" fill="currentColor" />
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-3">
                          <p className="font-medium text-sm line-clamp-1 mb-1">{content.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(history.last_position / 60)}:{(history.last_position % 60).toString().padStart(2, '0')} / {Math.floor(history.duration / 60)}:{(history.duration % 60).toString().padStart(2, '0')}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder={t('onDemand.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base bg-card/50 border-border focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <CategoryFilter 
            selectedType={filterType}
            onTypeChange={setFilterType}
            counts={categoryCounts}
          />

          {/* Loading State */}
          {loading ? (
            <div className="space-y-8">
              <div className="flex gap-4 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[280px]">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4 mt-3" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('onDemand.noContent')}</h3>
              <p className="text-muted-foreground">
                {t('onDemand.adjustFilters')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Trending Section */}
              {filterType === "all" && !searchTerm && (
                <ContentCarouselSection
                  title="Tendencias"
                  subtitle="Lo más visto esta semana"
                  icon={<TrendingUp className="w-5 h-5 text-white" />}
                  contents={trendingContents}
                  gradientFrom="from-rose-500"
                  gradientTo="to-pink-600"
                  onContentClick={handleContentClick}
                  onFavoriteClick={handleFavoriteClick}
                  onPlaylistClick={handlePlaylistClick}
                  isFavorite={isFavorite}
                  favLoading={favLoading}
                />
              )}

              {/* New Content Section */}
              {filterType === "all" && !searchTerm && (
                <ContentCarouselSection
                  title="Recién Agregados"
                  subtitle="Lo último en la plataforma"
                  icon={<Sparkles className="w-5 h-5 text-white" />}
                  contents={newContents}
                  gradientFrom="from-violet-500"
                  gradientTo="to-purple-600"
                  onContentClick={handleContentClick}
                  onFavoriteClick={handleFavoriteClick}
                  onPlaylistClick={handlePlaylistClick}
                  isFavorite={isFavorite}
                  favLoading={favLoading}
                />
              )}

              {/* Free Content Grid */}
              <ContentGrid
                title={t('onDemand.freeContent')}
                subtitle={`${freeContents.length} ${t('onDemand.videosAvailable')}`}
                contents={freeContents}
                variant="free"
                expandedCards={expandedCards}
                onToggleCard={toggleCardInfo}
                onContentClick={handleContentClick}
                onFavoriteClick={handleFavoriteClick}
                onPlaylistClick={handlePlaylistClick}
                isFavorite={isFavorite}
                favLoading={favLoading}
              />

              {/* Premium Content Grid */}
              <ContentGrid
                title={t('onDemand.premiumContent')}
                subtitle={`${paidContents.length} ${t('onDemand.exclusiveVideos')}`}
                contents={paidContents}
                variant="premium"
                expandedCards={expandedCards}
                onToggleCard={toggleCardInfo}
                onContentClick={handleContentClick}
                onFavoriteClick={handleFavoriteClick}
                onPlaylistClick={handlePlaylistClick}
                isFavorite={isFavorite}
                favLoading={favLoading}
              />
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Add to Playlist Dialog */}
      {selectedContentId && (
        <AddToPlaylistDialog
          open={showAddToPlaylist}
          onOpenChange={setShowAddToPlaylist}
          contentId={selectedContentId}
        />
      )}
    </div>
  );
};

export default OnDemand;
