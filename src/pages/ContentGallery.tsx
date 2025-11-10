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
import { Loader2, Play, Music, Image as ImageIcon, Clock, MonitorPlay, HardDrive } from "lucide-react";
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
  uploader_id: string;
}

const ContentGallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<"all" | "videos" | "audios" | "photos">("all");

  useEffect(() => {
    loadContent();
  }, [user]);

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
                      </div>

                      {/* Ver contenido */}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          if (item.video_url) window.open(item.video_url, '_blank');
                          else if (item.audio_url) window.open(item.audio_url, '_blank');
                          else if (item.photo_url) window.open(item.photo_url, '_blank');
                        }}
                      >
                        Ver Contenido
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContentGallery;
