import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { notifyError } from "@/lib/notifications";
import { useFavorites } from "@/hooks/useFavorites";
import { Play, Search, Loader2, TrendingUp, Sparkles, Heart, ListPlus, Video, Music } from "lucide-react";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const { toggleFavorite, isFavorite, loading: favLoading } = useFavorites();

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
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setContents(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      notifyError('Error al cargar contenido', error instanceof Error ? error : undefined);
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

  const freeContents = useMemo(() => filteredContents.filter(c => c.is_free), [filteredContents]);
  const paidContents = useMemo(() => filteredContents.filter(c => !c.is_free), [filteredContents]);

  const handleContentClick = (content: Content) => {
    navigate(`/video/${content.id}`);
  };

  const handleContinueWatching = (history: PlaybackHistory) => {
    if (!history.content) return;
    navigate(`/video/${history.content.id}`);
  };

  // Content Card Component
  const ContentCard = ({ content, index }: { content: Content; index: number }) => (
    <div 
      className="group cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 0.03}s` }}
      onClick={() => handleContentClick(content)}
    >
      <div className="relative overflow-hidden rounded-lg bg-card/30 mb-3">
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

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-background ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-black/50 hover:bg-black/70 border-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(content.id);
            }}
            disabled={favLoading}
          >
            <Heart className={cn("h-4 w-4", isFavorite(content.id) && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-black/50 hover:bg-black/70 border-0"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedContentId(content.id);
              setShowAddToPlaylist(true);
            }}
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        </div>

        {/* Duration */}
        {content.duration && (
          <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
            {formatDuration(content.duration)}
          </span>
        )}

      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {content.band_name && (
            <p className="text-xs text-muted-foreground">{content.band_name}</p>
          )}
          <h3 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors mt-1">
            {content.title}
          </h3>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {content.views_count.toLocaleString()} vistas
          </p>
        </div>
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0",
          content.is_free 
            ? "bg-cyan-500/20 text-cyan-400" 
            : "bg-amber-500/20 text-amber-400"
        )}>
          {content.is_free ? "Libre" : "Pago"}
        </span>
      </div>
    </div>
  );

  if (checkingProfile) {
    return (
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="relative z-10">
          <Header />
          <main id="main-content" className="pt-24 pb-16">
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
          <main id="main-content" className="pt-24 pb-16">
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
        
        <main id="main-content" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Minimal Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-foreground">
              On Demand
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explora contenido exclusivo de la comunidad
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card/30 border-border/50 focus:border-primary/50 h-10"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 mb-10 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {[
              { value: "all", label: "Todo" },
              { value: "video_musical_vivo", label: "Video Musical en Vivo" },
              { value: "video_clip", label: "Video Clip" },
              { value: "podcast", label: "Podcast" },
              { value: "documental", label: "Documental" },
              { value: "corto", label: "Cortos" },
              { value: "pelicula", label: "Películas" },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterType(cat.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                  filterType === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card/30 text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-video rounded-lg mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-10 h-10 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No se encontró contenido</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Continue Watching */}
              {user && continueWatching.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Play className="w-4 h-4 text-primary" />
                    <h2 className="text-lg font-medium">Continuar viendo</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {continueWatching.slice(0, 4).map((history) => {
                      const content = history.content as Content;
                      if (!content) return null;
                      const progress = (history.last_position / history.duration) * 100;
                      
                      return (
                        <div
                          key={history.id}
                          className="group cursor-pointer"
                          onClick={() => handleContinueWatching(history)}
                        >
                          <div className="relative overflow-hidden rounded-lg bg-card/30 mb-3">
                            <AspectRatio ratio={16 / 9}>
                              {content.thumbnail_url ? (
                                <img
                                  src={content.thumbnail_url}
                                  alt={content.title}
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                  <Video className="w-5 h-5" />
                                </div>
                              )}
                            </AspectRatio>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="w-4 h-4 text-background ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          </div>
                          <h3 className="font-medium text-sm line-clamp-1">{content.title}</h3>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* All Content */}
              {filteredContents.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h2 className="text-lg font-medium">Contenido</h2>
                    <span className="text-xs text-muted-foreground ml-2">{filteredContents.length}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredContents.map((content, index) => (
                      <ContentCard key={content.id} content={content} index={index} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>

        <Footer />
      </div>

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
