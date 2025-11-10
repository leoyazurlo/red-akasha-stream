import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Play, Music, Image as ImageIcon, Clock, MonitorPlay, HardDrive, X, Eye, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  video_url: string | null;
  audio_url: string | null;
  photo_url: string | null;
  thumbnail_url: string | null;
  video_width: number | null;
  video_height: number | null;
  file_size: number | null;
  video_duration_seconds: number | null;
  audio_duration_seconds: number | null;
  status: string;
  created_at: string;
  views_count: number;
  likes_count: number;
  uploader_id: string;
}

const ContentGallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<"all" | "videos" | "audios" | "photos">("all");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [likingContent, setLikingContent] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
    if (user) {
      loadUserLikes();
    }
  }, [user]);

  const loadUserLikes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('content_likes')
        .select('content_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const likedIds = new Set(data?.map(like => like.content_id) || []);
      setUserLikes(likedIds);
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  const handleToggleLike = async (contentId: string, currentLikes: number) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLikingContent(contentId);
    const isLiked = userLikes.has(contentId);

    try {
      if (isLiked) {
        // Quitar like
        const { error } = await supabase
          .from('content_likes')
          .delete()
          .eq('content_id', contentId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Actualizar estado local
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(contentId);
          return newSet;
        });
        
        setContent(prevContent =>
          prevContent.map(c =>
            c.id === contentId
              ? { ...c, likes_count: Math.max(0, c.likes_count - 1) }
              : c
          )
        );
        
        if (selectedContent?.id === contentId) {
          setSelectedContent(prev => prev ? { ...prev, likes_count: Math.max(0, prev.likes_count - 1) } : null);
        }
      } else {
        // Agregar like
        const { error } = await supabase
          .from('content_likes')
          .insert({ content_id: contentId, user_id: user.id });
        
        if (error) throw error;
        
        // Actualizar estado local
        setUserLikes(prev => new Set([...prev, contentId]));
        
        setContent(prevContent =>
          prevContent.map(c =>
            c.id === contentId
              ? { ...c, likes_count: c.likes_count + 1 }
              : c
          )
        );
        
        if (selectedContent?.id === contentId) {
          setSelectedContent(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikingContent(null);
    }
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('content_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      // Si hay usuario, mostrar su contenido + contenido aprobado
      // Si no hay usuario, solo mostrar contenido aprobado
      if (user) {
        query = query.or(`status.eq.approved,uploader_id.eq.${user.id}`);
      } else {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query;

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getContentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      video_musical_vivo: "Video Musical en Vivo",
      video_clip: "Video Clip",
      podcast: "Podcast",
      documental: "Documental",
      corto: "Corto",
      pelicula: "Película"
    };
    return labels[type] || type;
  };

  const filteredContent = content.filter(item => {
    if (filter === "all") return true;
    if (filter === "videos") return item.video_url;
    if (filter === "audios") return item.audio_url;
    if (filter === "photos") return item.photo_url && !item.video_url && !item.audio_url;
    return true;
  });

  const handleOpenPlayer = async (item: ContentItem) => {
    setSelectedContent(item);
    setPlayerOpen(true);
    
    // Incrementar contador de visualizaciones
    try {
      const { error } = await supabase
        .from('content_uploads')
        .update({ views_count: (item.views_count || 0) + 1 })
        .eq('id', item.id);
      
      if (error) {
        console.error('Error updating views count:', error);
      } else {
        // Actualizar el contador localmente
        setContent(prevContent => 
          prevContent.map(c => 
            c.id === item.id 
              ? { ...c, views_count: (c.views_count || 0) + 1 }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleClosePlayer = () => {
    setPlayerOpen(false);
    // Pequeño delay antes de limpiar el contenido para evitar glitches visuales
    setTimeout(() => setSelectedContent(null), 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CosmicBackground />
        <Header />
        <main className="relative pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CosmicBackground />
      <Header />
      
      <main className="relative pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Galería de Contenido
              </h1>
              <p className="text-muted-foreground">
                Explora videos, audios y fotografías de la comunidad Red Akasha
              </p>
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="all">Todo</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="audios">Audios</TabsTrigger>
                <TabsTrigger value="photos">Fotos</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredContent.length === 0 ? (
              <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No hay contenido disponible en esta categoría</p>
                  {user && (
                    <Button 
                      onClick={() => navigate('/subir-contenido')}
                      className="mt-4"
                    >
                      Subir Contenido
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContent.map((item) => (
                  <Card key={item.id} className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors overflow-hidden">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-muted">
                      {item.thumbnail_url || item.photo_url ? (
                        <img 
                          src={item.thumbnail_url || item.photo_url || ''} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.video_url && <Play className="w-16 h-16 text-muted-foreground" />}
                          {item.audio_url && !item.video_url && <Music className="w-16 h-16 text-muted-foreground" />}
                          {item.photo_url && !item.video_url && !item.audio_url && <ImageIcon className="w-16 h-16 text-muted-foreground" />}
                        </div>
                      )}
                      
                      {/* Overlay con tipo */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="backdrop-blur-sm">
                          {getContentTypeLabel(item.content_type)}
                        </Badge>
                      </div>

                      {/* Status badge si es del usuario */}
                      {user && item.uploader_id === user.id && item.status !== 'approved' && (
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={item.status === 'pending' ? 'default' : 'destructive'}
                            className="backdrop-blur-sm"
                          >
                            {item.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1 text-foreground">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Metadatos */}
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {item.video_width && item.video_height && (
                          <div className="flex items-center gap-2">
                            <MonitorPlay className="w-4 h-4" />
                            <span>{item.video_width}x{item.video_height}</span>
                          </div>
                        )}
                        
                        {(item.video_duration_seconds || item.audio_duration_seconds) && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatDuration(item.video_duration_seconds || item.audio_duration_seconds)}
                            </span>
                          </div>
                        )}
                        
                        {item.file_size && (
                          <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4" />
                            <span>{formatFileSize(item.file_size)}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>{item.views_count || 0} visualizaciones</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          <span>{item.likes_count || 0} favoritos</span>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <Button 
                          variant={userLikes.has(item.id) ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLike(item.id, item.likes_count);
                          }}
                          disabled={likingContent === item.id}
                        >
                          <Heart 
                            className={`w-4 h-4 mr-2 ${userLikes.has(item.id) ? 'fill-current' : ''}`}
                          />
                          {userLikes.has(item.id) ? 'Me gusta' : 'Favorito'}
                        </Button>

                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenPlayer(item)}
                        >
                          {item.video_url && <Play className="w-4 h-4 mr-2" />}
                          {item.audio_url && !item.video_url && <Music className="w-4 h-4 mr-2" />}
                          {item.photo_url && !item.video_url && !item.audio_url && <ImageIcon className="w-4 h-4 mr-2" />}
                          Ver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal del Reproductor */}
        <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            {selectedContent && (
              <>
                <DialogHeader className="p-6 pb-4">
                  <DialogTitle className="text-xl font-semibold">
                    {selectedContent.title}
                  </DialogTitle>
                  {selectedContent.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedContent.description}
                    </p>
                  )}
                </DialogHeader>

                <div className="px-6 pb-6">
                  {/* Reproductor de Video */}
                  {selectedContent.video_url && (
                    <div className="w-full rounded-lg overflow-hidden bg-black">
                      <video 
                        src={selectedContent.video_url}
                        controls
                        autoPlay
                        className="w-full h-auto max-h-[60vh]"
                        controlsList="nodownload"
                      >
                        Tu navegador no soporta el elemento de video.
                      </video>
                    </div>
                  )}

                  {/* Reproductor de Audio */}
                  {selectedContent.audio_url && !selectedContent.video_url && (
                    <div className="w-full p-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-border">
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                          <Music className="w-12 h-12 text-primary" />
                        </div>
                      </div>
                      <audio 
                        src={selectedContent.audio_url}
                        controls
                        autoPlay
                        className="w-full"
                        controlsList="nodownload"
                      >
                        Tu navegador no soporta el elemento de audio.
                      </audio>
                    </div>
                  )}

                  {/* Visor de Imagen */}
                  {selectedContent.photo_url && !selectedContent.video_url && !selectedContent.audio_url && (
                    <div className="w-full rounded-lg overflow-hidden">
                      <img 
                        src={selectedContent.photo_url}
                        alt={selectedContent.title}
                        className="w-full h-auto max-h-[60vh] object-contain bg-muted"
                      />
                    </div>
                  )}

                  {/* Metadatos */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      Información Técnica
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Tipo</p>
                        <p className="font-medium text-foreground">
                          {getContentTypeLabel(selectedContent.content_type)}
                        </p>
                      </div>
                      
                      {selectedContent.video_width && selectedContent.video_height && (
                        <div>
                          <p className="text-muted-foreground mb-1">Resolución</p>
                          <p className="font-medium text-foreground">
                            {selectedContent.video_width}x{selectedContent.video_height}
                          </p>
                        </div>
                      )}
                      
                      {(selectedContent.video_duration_seconds || selectedContent.audio_duration_seconds) && (
                        <div>
                          <p className="text-muted-foreground mb-1">Duración</p>
                          <p className="font-medium text-foreground">
                            {formatDuration(selectedContent.video_duration_seconds || selectedContent.audio_duration_seconds)}
                          </p>
                        </div>
                      )}
                      
                      {selectedContent.file_size && (
                        <div>
                          <p className="text-muted-foreground mb-1">Tamaño</p>
                          <p className="font-medium text-foreground">
                            {formatFileSize(selectedContent.file_size)}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-muted-foreground mb-1">Visualizaciones</p>
                        <p className="font-medium text-foreground flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {selectedContent.views_count || 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-1">Favoritos</p>
                        <p className="font-medium text-foreground flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {selectedContent.likes_count || 0}
                        </p>
                      </div>
                    </div>

                    {/* Botón de favorito en el modal */}
                    <div className="mt-4">
                      <Button
                        variant={userLikes.has(selectedContent.id) ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleToggleLike(selectedContent.id, selectedContent.likes_count)}
                        disabled={likingContent === selectedContent.id}
                      >
                        <Heart 
                          className={`w-4 h-4 mr-2 ${userLikes.has(selectedContent.id) ? 'fill-current' : ''}`}
                        />
                        {likingContent === selectedContent.id 
                          ? 'Procesando...' 
                          : userLikes.has(selectedContent.id) 
                            ? 'Quitar de favoritos' 
                            : 'Agregar a favoritos'}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default ContentGallery;
