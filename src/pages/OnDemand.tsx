import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import { Play, Video, Music, Image as ImageIcon, Search, Filter, DollarSign, ChevronDown, ChevronUp, Info, Heart, Loader2, ListPlus } from "lucide-react";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);
  const [continueWatching, setContinueWatching] = useState<PlaybackHistory[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchContents();
    if (user) {
      fetchContinueWatching();
    }
  }, [user]);

  useEffect(() => {
    filterContents();
  }, [searchTerm, filterType, contents]);

  const fetchContents = async () => {
    try {
      let query = supabase
        .from('content_uploads')
        .select('*')
        .in('content_type', ['video_musical_vivo', 'video_clip', 'corto', 'documental', 'pelicula'])
        .order('created_at', { ascending: false });

      // Si hay usuario, mostrar su contenido pendiente + todo lo aprobado
      // Si no hay usuario, solo mostrar contenido aprobado
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

      // Filtrar solo los que tienen contenido y progreso mayor a 30 segundos
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

  const filterContents = () => {
    let filtered = [...contents];

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(content => 
        content.title.toLowerCase().includes(term) ||
        content.description?.toLowerCase().includes(term) ||
        content.band_name?.toLowerCase().includes(term) ||
        content.producer_name?.toLowerCase().includes(term)
      );
    }

    // Filtrar por tipo
    if (filterType !== "all") {
      filtered = filtered.filter(content => content.content_type === filterType);
    }

    setFilteredContents(filtered);
  };

  // Separar contenido en gratuito y pago
  const freeContents = filteredContents.filter(c => c.is_free);
  const paidContents = filteredContents.filter(c => !c.is_free);

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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContentTypeLabel = (type: string) => {
    return t(`onDemand.types.${type}`, type);
  };

  const handleContentClick = (content: Content) => {
    // Navegar a la página de detalle
    navigate(`/video/${content.id}`);
  };

  const handleContinueWatching = (history: PlaybackHistory) => {
    if (!history.content) return;
    navigate(`/video/${history.content.id}`);
  };

  const handlePurchase = () => {
    toast({
      title: t('onDemand.comingSoon'),
      description: t('onDemand.paymentSoon'),
    });
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10">
        <Header />
        
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {t('onDemand.title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('onDemand.subtitle')}
            </p>
          </div>

          {/* Continue Watching Section */}
          {user && continueWatching.length > 0 && (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  {t('onDemand.continueWatching')}
                </CardTitle>
                <CardDescription>
                  {t('onDemand.resumeWhere')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {continueWatching.map((history) => {
                    const content = history.content as Content;
                    if (!content) return null;
                    
                    const progress = (history.last_position / history.duration) * 100;
                    
                    return (
                      <Card 
                        key={history.id}
                        className="group overflow-hidden border-border bg-card/30 hover:bg-card/60 transition-all cursor-pointer"
                        onClick={() => handleContinueWatching(history)}
                      >
                        <div className="relative overflow-hidden">
                          <AspectRatio ratio={16 / 9}>
                            {content.thumbnail_url ? (
                              <img
                                src={content.thumbnail_url}
                                alt={content.title}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                                {getContentIcon(content.content_type)}
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
                            <Play className="w-12 h-12 text-white" fill="white" />
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

          {/* Filters */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t('onDemand.filters')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t('onDemand.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Type Filter */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('onDemand.contentType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('onDemand.allTypes')}</SelectItem>
                    <SelectItem value="video_musical_vivo">{t('onDemand.liveMusicalVideos')}</SelectItem>
                    <SelectItem value="video_clip">{t('onDemand.videoClips')}</SelectItem>
                    <SelectItem value="corto">{t('onDemand.shorts')}</SelectItem>
                    <SelectItem value="documental">{t('onDemand.documentaries')}</SelectItem>
                    <SelectItem value="pelicula">{t('onDemand.movies')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

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
            <div className="space-y-12">
              {/* FREE CONTENT SECTION */}
              {freeContents.length > 0 && (
                <section>
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-1 bg-gradient-to-b from-cyan-500 to-cyan-600 rounded-full"></div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
                        {t('onDemand.freeContent')}
                      </h2>
                    </div>
                    <p className="text-muted-foreground ml-7">
                      {freeContents.length} {t('onDemand.videosAvailable')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {freeContents.map((content) => {
                      const isExpanded = expandedCards.has(content.id);
                      return (
                        <Card 
                          key={content.id} 
                          className="group overflow-hidden border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-cyan-600/5 backdrop-blur-sm hover:from-cyan-500/10 hover:to-cyan-600/10 transition-all"
                        >
                          {/* Thumbnail con marco cyan en bordes */}
                          <div 
                            className="relative overflow-hidden bg-secondary/20 cursor-pointer border-2 border-cyan-500/40 rounded-t-lg"
                            onClick={() => handleContentClick(content)}
                            style={{
                              boxShadow: '0 0 15px rgba(6, 182, 212, 0.25)'
                            }}
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

                            {/* Favorite Button */}
                            <Button
                              size="icon"
                              variant="secondary"
                              className={`absolute top-2 right-2 transition-opacity bg-background/80 hover:bg-background z-20 ${
                                isFavorite(content.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
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
                                  className={`h-4 w-4 ${isFavorite(content.id) ? 'fill-red-500 text-red-500' : ''}`}
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
                                setSelectedContentId(content.id);
                                setShowAddToPlaylist(true);
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

                          {/* Título visible siempre */}
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
                          </CardHeader>

                          {/* Información colapsable */}
                          <CardContent className="p-4 pt-0">
                            <Collapsible 
                              open={isExpanded}
                              onOpenChange={() => toggleCardInfo(content.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full flex items-center justify-center gap-2 text-xs text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10"
                                >
                                  <Info className="w-3 h-3" />
                                  {isExpanded ? "Ver menos" : "Ver más información"}
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </Button>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent className="mt-3 space-y-3">
                                <Badge variant="outline" className="border-cyan-500 text-cyan-500 w-fit">
                                  {getContentTypeLabel(content.content_type)}
                                </Badge>
                                
                                {content.description && (
                                  <CardDescription className="text-sm">
                                    {content.description}
                                  </CardDescription>
                                )}

                                <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t border-cyan-500/20">
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
              )}

              {/* PREMIUM CONTENT SECTION */}
              {paidContents.length > 0 && (
                <section>
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-1 bg-gradient-to-b from-amber-500 via-yellow-500 to-orange-500 rounded-full"></div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                        {t('onDemand.premiumContent')}
                      </h2>
                    </div>
                    <p className="text-muted-foreground ml-7">
                      {paidContents.length} {t('onDemand.exclusiveVideos')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paidContents.map((content) => {
                      const isExpanded = expandedCards.has(`premium-${content.id}`);
                      return (
                        <Card 
                          key={content.id} 
                          className="group overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 backdrop-blur-sm hover:from-amber-500/15 hover:via-yellow-500/10 hover:to-orange-500/15 transition-all relative"
                        >
                          {/* Premium Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          
                          {/* Thumbnail con borde cyan */}
                          <div 
                            className="relative overflow-hidden bg-secondary/20 cursor-pointer border-2 border-cyan-500/40 rounded-t-lg"
                            onClick={() => handleContentClick(content)}
                            style={{
                              boxShadow: '0 0 15px rgba(6, 182, 212, 0.25)'
                            }}
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
                            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none flex items-center gap-1 shadow-lg shadow-amber-500/50">
                              <DollarSign className="w-3 h-3" />
                              {content.price} {content.currency}
                            </Badge>

                            {/* Favorite Button */}
                            <Button
                              size="icon"
                              variant="secondary"
                              className={`absolute top-2 right-2 transition-opacity bg-background/80 hover:bg-background z-20 ${
                                isFavorite(content.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
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
                                  className={`h-4 w-4 ${isFavorite(content.id) ? 'fill-red-500 text-red-500' : ''}`}
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
                                setSelectedContentId(content.id);
                                setShowAddToPlaylist(true);
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

                          {/* Título visible siempre */}
                          <CardHeader className="p-4 pb-2 relative z-10">
                            <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
                          </CardHeader>

                          {/* Información colapsable */}
                          <CardContent className="p-4 pt-0 relative z-10">
                            <Collapsible 
                              open={isExpanded}
                              onOpenChange={() => toggleCardInfo(`premium-${content.id}`)}
                            >
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full flex items-center justify-center gap-2 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                                >
                                  <Info className="w-3 h-3" />
                                  {isExpanded ? "Ver menos" : "Ver más información"}
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </Button>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent className="mt-3 space-y-3">
                                <Badge variant="outline" className="border-amber-500 text-amber-500 w-fit">
                                  {getContentTypeLabel(content.content_type)}
                                </Badge>
                                
                                {content.description && (
                                  <CardDescription className="text-sm">
                                    {content.description}
                                  </CardDescription>
                                )}

                                <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t border-amber-500/20">
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
              )}
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