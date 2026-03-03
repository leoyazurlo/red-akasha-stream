import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { notifyError } from "@/lib/notifications";
import { useFavorites } from "@/hooks/useFavorites";
import { Play, Search, Loader2, Video, ListMusic, ArrowUpDown, Clock, TrendingUp, SortAsc, PlayCircle } from "lucide-react";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { useQueuePlayer, QueueItem } from "@/contexts/QueuePlayerContext";
import { cn } from "@/lib/utils";
import { CategoryFilter } from "@/components/ondemand/CategoryFilter";
import { ContentGrid } from "@/components/ondemand/ContentGrid";
import { FloatingQueuePlayer } from "@/components/ondemand/FloatingQueuePlayer";

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

type SortBy = 'recent' | 'popular' | 'alphabetical';

const sortOptions: { value: SortBy; label: string; icon: React.ElementType }[] = [
  { value: 'recent', label: 'Recientes', icon: Clock },
  { value: 'popular', label: 'Populares', icon: TrendingUp },
  { value: 'alphabetical', label: 'A-Z', icon: SortAsc },
];

const formatRemaining = (position: number, duration: number) => {
  const remaining = Math.max(0, duration - position);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${mins}:${secs.toString().padStart(2, '0')} restantes`;
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
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const { toggleFavorite, isFavorite, loading: favLoading } = useFavorites();
  const { setQueue, isOpen: queueOpen } = useQueuePlayer();

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
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase.from('profile_details').select('id').eq('user_id', user.id).limit(1);
      if (error) throw error;
      setHasProfile(!(!data || data.length === 0));
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select('*')
        .in('content_type', ['video_musical_vivo', 'video_clip', 'podcast', 'corto', 'documental', 'pelicula'])
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
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
        .select(`*, content:content_uploads(*)`)
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('last_watched_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      const validHistory = (data || [])
        .filter(item => item.content && item.last_position > 30)
        .map(item => ({ ...item, content: Array.isArray(item.content) ? item.content[0] : item.content }));
      setContinueWatching(validHistory);
    } catch (error) {
      console.error('Error fetching continue watching:', error);
    }
  };

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

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [contents, searchTerm, filterType, sortBy]);

  const freeContents = useMemo(() => filteredContents.filter(c => c.is_free), [filteredContents]);
  const paidContents = useMemo(() => filteredContents.filter(c => !c.is_free), [filteredContents]);

  const categoryCounts = useMemo(() => {
    const base = searchTerm ? filteredContents : contents;
    return {
      all: base.length,
      video_musical_vivo: base.filter(c => c.content_type === 'video_musical_vivo').length,
      video_clip: base.filter(c => c.content_type === 'video_clip').length,
      podcast: base.filter(c => c.content_type === 'podcast').length,
      corto: base.filter(c => c.content_type === 'corto').length,
      documental: base.filter(c => c.content_type === 'documental').length,
      pelicula: base.filter(c => c.content_type === 'pelicula').length,
    };
  }, [contents, filteredContents, searchTerm]);

  const handleContentClick = (content: Content) => navigate(`/video/${content.id}`);

  const handlePlayQueue = () => {
    const items: QueueItem[] = filteredContents
      .filter(c => c.video_url || c.audio_url)
      .map(c => ({
        id: c.id, title: c.title, video_url: c.video_url, audio_url: c.audio_url,
        thumbnail_url: c.thumbnail_url, content_type: c.content_type, band_name: c.band_name, duration: c.duration,
      }));
    if (items.length > 0) setQueue(items, 0);
  };

  const handleContinueWatching = (history: PlaybackHistory) => {
    if (!history.content) return;
    navigate(`/video/${history.content.id}`);
  };

  const handleFavoriteClick = (contentId: string) => toggleFavorite(contentId);
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
                    <Button onClick={() => navigate("/asociate")} className="flex-1">{t('onDemand.joinNow')}</Button>
                    <Button onClick={() => navigate("/")} variant="outline" className="flex-1">{t('common.goBack')}</Button>
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
        
        <main id="main-content" className={cn("pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto", queueOpen ? "pb-32" : "pb-16")}>

          {/* Header con identidad cyan */}
          <div className="mb-8 relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card/60 to-card/40 backdrop-blur-sm p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(180_100%_50%/0.08),transparent_60%)] pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_hsl(180_100%_50%/0.2)]">
                  <PlayCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">On Demand</h1>
                  <p className="text-sm text-muted-foreground">
                    {contents.length > 0 
                      ? `${contents.length} contenidos disponibles`
                      : 'Explora contenido exclusivo'
                    }
                  </p>
                </div>
              </div>
              {filteredContents.length > 0 && (
                <Button onClick={handlePlayQueue} size="sm" className="gap-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 hover:text-cyan-300">
                  <ListMusic className="w-4 h-4" />
                  <span className="hidden sm:inline">Reproducir cola</span>
                </Button>
              )}
            </div>
          </div>

          {/* Barra unificada: Search + Filters + Sort */}
          <div className="mb-8 space-y-3 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contenido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:border-cyan-500/50 h-9 text-sm"
                />
              </div>
              
              {/* Sort */}
              <div className="flex gap-1.5">
                {sortOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        sortBy === opt.value
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Category Filter */}
            <CategoryFilter
              selectedType={filterType}
              onTypeChange={setFilterType}
              counts={categoryCounts}
            />
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
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                <Search className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-muted-foreground font-medium">
                  {searchTerm
                    ? `No se encontró contenido para "${searchTerm}"`
                    : 'No hay contenido en esta categoría'}
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Intenta con otra búsqueda o explora todas las categorías
                </p>
              </div>
              {filterType !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setFilterType("all"); setSearchTerm(""); }}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Ver todo el contenido
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {/* Continue Watching */}
              {user && continueWatching.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Play className="w-4 h-4 text-cyan-400" />
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
                          <div className="relative overflow-hidden rounded-lg bg-card/30 mb-2">
                            <AspectRatio ratio={16 / 9}>
                              {content.thumbnail_url ? (
                                <img src={content.thumbnail_url} alt={content.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                  <Video className="w-5 h-5" />
                                </div>
                              )}
                            </AspectRatio>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div className="h-full bg-cyan-400" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="w-4 h-4 text-background ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          </div>
                          {(content.band_name || content.producer_name) && (
                            <p className="text-xs font-medium text-foreground truncate">{content.band_name || content.producer_name}</p>
                          )}
                          <h3 className="text-xs text-muted-foreground line-clamp-1">{content.title}</h3>
                          <p className="text-[10px] text-cyan-400/70 mt-0.5">{formatRemaining(history.last_position, history.duration)}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Free Content Grid */}
              <ContentGrid
                title="Contenido Gratuito"
                subtitle="Disfruta sin costo"
                contents={freeContents}
                variant="free"
                onContentClick={handleContentClick}
                onFavoriteClick={handleFavoriteClick}
                onPlaylistClick={handlePlaylistClick}
                isFavorite={isFavorite}
                favLoading={favLoading}
              />

              {/* Premium Content Grid */}
              <ContentGrid
                title="Contenido Premium"
                subtitle="Contenido exclusivo de artistas"
                contents={paidContents}
                variant="premium"
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

      <FloatingQueuePlayer />

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
