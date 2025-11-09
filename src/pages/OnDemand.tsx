import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { OnDemandPlayer } from "@/components/OnDemandPlayer";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Video, Music, Image as ImageIcon, Search, Filter, DollarSign } from "lucide-react";
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

const OnDemand = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPrice, setFilterPrice] = useState<string>("all");
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContents();
  }, []);

  useEffect(() => {
    filterContents();
  }, [searchTerm, filterType, filterPrice, contents]);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContents(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el contenido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    // Filtrar por precio
    if (filterPrice === "free") {
      filtered = filtered.filter(content => content.is_free);
    } else if (filterPrice === "paid") {
      filtered = filtered.filter(content => !content.is_free);
    }

    setFilteredContents(filtered);
  };

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
    const labels: Record<string, string> = {
      video_musical_vivo: "Video Musical en Vivo",
      video_clip: "Video Clip",
      podcast: "Podcast",
      corto: "Cortometraje",
      documental: "Documental",
      pelicula: "Película"
    };
    return labels[type] || type;
  };

  const handleContentClick = (content: Content) => {
    setSelectedContent(content);
    setPlayerOpen(true);
    
    // Incrementar contador de vistas
    supabase
      .from('content_uploads')
      .update({ views_count: content.views_count + 1 })
      .eq('id', content.id)
      .then(() => {
        // Actualizar localmente
        setContents(prev => 
          prev.map(c => c.id === content.id 
            ? { ...c, views_count: c.views_count + 1 }
            : c
          )
        );
      });
  };

  const handlePurchase = () => {
    toast({
      title: "Próximamente",
      description: "El sistema de pagos estará disponible pronto",
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
              On Demand
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Accede a nuestra biblioteca de contenido exclusivo. Videos, audios, fotos y podcasts cuando quieras, donde quieras.
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar contenido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Type Filter */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de contenido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="video_musical_vivo">Videos Musicales en Vivo</SelectItem>
                    <SelectItem value="video_clip">Video Clips</SelectItem>
                    <SelectItem value="podcast">Podcasts</SelectItem>
                    <SelectItem value="corto">Cortometrajes</SelectItem>
                    <SelectItem value="documental">Documentales</SelectItem>
                    <SelectItem value="pelicula">Películas</SelectItem>
                  </SelectContent>
                </Select>

                {/* Price Filter */}
                <Select value={filterPrice} onValueChange={setFilterPrice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Precio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="free">Gratis</SelectItem>
                    <SelectItem value="paid">De pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              {loading ? "Cargando..." : `${filteredContents.length} contenido${filteredContents.length !== 1 ? 's' : ''} encontrado${filteredContents.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Content Grid */}
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
              <h3 className="text-xl font-semibold mb-2">No se encontró contenido</h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros o realizar una búsqueda diferente
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContents.map((content) => (
                <Card 
                  key={content.id} 
                  className="group overflow-hidden border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all cursor-pointer"
                  onClick={() => handleContentClick(content)}
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden bg-secondary/20">
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
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className="border-primary text-primary">
                        {getContentTypeLabel(content.content_type)}
                      </Badge>
                      {content.is_free ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Gratis
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {content.price} {content.currency}
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
                    
                    {content.description && (
                      <CardDescription className="line-clamp-2 text-sm">
                        {content.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-0">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {content.band_name && (
                        <p>Banda: {content.band_name}</p>
                      )}
                      {content.producer_name && (
                        <p>Productor: {content.producer_name}</p>
                      )}
                      {content.venue_name && (
                        <p>Sala: {content.venue_name}</p>
                      )}
                      <p className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {content.views_count} reproducciones
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Video/Audio Player */}
      {selectedContent && (
        <OnDemandPlayer
          open={playerOpen}
          onOpenChange={setPlayerOpen}
          content={selectedContent}
          isPurchased={false}
          onPurchase={handlePurchase}
        />
      )}
    </div>
  );
};

export default OnDemand;