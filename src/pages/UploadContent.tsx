import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface ProfileOption {
  id: string;
  display_name: string;
}

const UploadContent = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [bands, setBands] = useState<ProfileOption[]>([]);
  const [producers, setProducers] = useState<ProfileOption[]>([]);
  const [studios, setStudios] = useState<ProfileOption[]>([]);
  const [venues, setVenues] = useState<ProfileOption[]>([]);
  const [promoters, setPromoters] = useState<ProfileOption[]>([]);
  const [showOtherBand, setShowOtherBand] = useState(false);
  const [showOtherProducer, setShowOtherProducer] = useState(false);
  const [showOtherStudio, setShowOtherStudio] = useState(false);
  const [showOtherVenue, setShowOtherVenue] = useState(false);
  const [showOtherPromoter, setShowOtherPromoter] = useState(false);
  const [formData, setFormData] = useState({
    content_type: "",
    title: "",
    description: "",
    video_url: "",
    audio_url: "",
    photo_url: "",
    podcast_category: "",
    band_name: "",
    producer_name: "",
    recording_studio: "",
    venue_name: "",
    promoter_name: "",
    is_free: true,
    price: "0",
    currency: "USD",
  });

  const contentTypes = [
    { value: "video_musical_vivo", label: "Video Musical en Vivo" },
    { value: "video_clip", label: "Video Clip" },
    { value: "podcast", label: "Podcast" },
    { value: "documental", label: "Documental" },
    { value: "corto", label: "Corto" },
    { value: "pelicula", label: "Película" }
  ];

  const podcastCategories = [
    { value: "produccion", label: "Producción" },
    { value: "marketing_digital", label: "Marketing Digital" },
    { value: "derecho_autor", label: "Derecho de Autor" },
    { value: "management", label: "Management" },
    { value: "composicion", label: "Composición" }
  ];

  useEffect(() => {
    checkUserProfile();
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      // Cargar bandas
      const { data: bandsData } = await supabase
        .from('profile_details')
        .select('id, display_name')
        .eq('profile_type', 'agrupacion_musical')
        .order('display_name');
      
      // Cargar productores artísticos
      const { data: producersData } = await supabase
        .from('profile_details')
        .select('id, display_name')
        .eq('profile_type', 'productor_artistico')
        .order('display_name');
      
      // Cargar estudios de grabación
      const { data: studiosData } = await supabase
        .from('profile_details')
        .select('id, display_name')
        .eq('profile_type', 'estudio_grabacion')
        .order('display_name');
      
      // Cargar salas/venues
      const { data: venuesData } = await supabase
        .from('profile_details')
        .select('id, display_name')
        .eq('profile_type', 'sala_concierto')
        .order('display_name');
      
      // Cargar promotores artísticos
      const { data: promotersData } = await supabase
        .from('profile_details')
        .select('id, display_name')
        .eq('profile_type', 'promotor_artistico')
        .order('display_name');
      
      setBands(bandsData || []);
      setProducers(producersData || []);
      setStudios(studiosData || []);
      setVenues(venuesData || []);
      setPromoters(promotersData || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para subir contenido",
          variant: "destructive",
        });
        return;
      }

      const contentData: any = {
        uploader_id: user.id,
        content_type: formData.content_type,
        title: formData.title,
        description: formData.description || null,
        video_url: formData.video_url || null,
        audio_url: formData.audio_url || null,
        photo_url: formData.photo_url || null,
        status: 'pending',
        is_free: formData.is_free,
        price: formData.is_free ? 0 : parseFloat(formData.price) || 0,
        currency: formData.currency,
      };

      // Agregar campos específicos según el tipo
      if (formData.content_type === 'podcast') {
        contentData.podcast_category = formData.podcast_category || null;
      }

      // Agregar ficha técnica
      if (formData.band_name) contentData.band_name = formData.band_name;
      if (formData.producer_name) contentData.producer_name = formData.producer_name;
      if (formData.recording_studio) contentData.recording_studio = formData.recording_studio;
      if (formData.venue_name) contentData.venue_name = formData.venue_name;
      if (formData.promoter_name) contentData.promoter_name = formData.promoter_name;

      const { error } = await supabase
        .from('content_uploads')
        .insert(contentData);

      if (error) throw error;
      
      toast({
        title: "¡Contenido subido!",
        description: "Tu contenido está en revisión y será publicado pronto.",
      });

      // Limpiar formulario
      setFormData({
        content_type: "",
        title: "",
        description: "",
        video_url: "",
        audio_url: "",
        photo_url: "",
        podcast_category: "",
        band_name: "",
        producer_name: "",
        recording_studio: "",
        venue_name: "",
        promoter_name: "",
        is_free: true,
        price: "0",
        currency: "USD",
      });
    } catch (error: any) {
      console.error('Error al subir contenido:', error);
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al subir tu contenido. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (checkingProfile) {
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

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-background">
        <CosmicBackground />
        <Header />
        
        <main className="relative pt-24 pb-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Asociación Requerida</CardTitle>
                <CardDescription>
                  Para subir contenido, primero debes asociarte a la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No tienes un perfil creado</AlertTitle>
                  <AlertDescription>
                    Para poder subir contenido a la plataforma, necesitas completar el proceso de asociación y crear tu perfil primero.
                  </AlertDescription>
                </Alert>
                <div className="mt-6 flex gap-4">
                  <Button onClick={() => navigate("/asociate")} className="flex-1">
                    Asociarme Ahora
                  </Button>
                  <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                    Volver al Inicio
                  </Button>
                </div>
              </CardContent>
            </Card>
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
          <div className="max-w-2xl mx-auto">
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400">Subir Contenido</CardTitle>
                <CardDescription>
                  Comparte tus videos y fotografías con la comunidad de Red Akasha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="content_type">Tipo de contenido *</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de contenido" />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.content_type === 'podcast' && (
                    <div className="space-y-2">
                      <Label htmlFor="podcast_category">Categoría del podcast *</Label>
                      <Select
                        value={formData.podcast_category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, podcast_category: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {podcastCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Título del contenido"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe tu contenido..."
                      className="min-h-32"
                    />
                  </div>

                  {/* Sección de Video */}
                  {formData.content_type !== 'podcast' && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">Video</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Comparte tu video musical, video clip, documental o contenido audiovisual
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="video_url">URL del video</Label>
                        <Input
                          id="video_url"
                          name="video_url"
                          value={formData.video_url}
                          onChange={handleChange}
                          placeholder="https://youtube.com/watch?v=... o URL de tu video"
                        />
                      </div>
                    </div>
                  )}

                  {/* Sección de Fotografía */}
                  {formData.content_type !== 'podcast' && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">Fotografía</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Sube fotografías de conciertos, sesiones de grabación o material gráfico relacionado
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="photo_url">URL de la fotografía</Label>
                        <Input
                          id="photo_url"
                          name="photo_url"
                          value={formData.photo_url}
                          onChange={handleChange}
                          placeholder="https://... o URL de tu fotografía"
                        />
                        <p className="text-xs text-muted-foreground">
                          Puedes compartir imágenes de eventos, backstage, portadas de discos, etc.
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.content_type === 'podcast' && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">Audio</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Comparte tu podcast sobre producción, marketing, derecho de autor y más
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audio_url">URL del audio *</Label>
                        <Input
                          id="audio_url"
                          name="audio_url"
                          required
                          value={formData.audio_url}
                          onChange={handleChange}
                          placeholder="URL del archivo de audio"
                        />
                      </div>
                    </div>
                  )}

                  {/* Sección de Monetización */}
                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-cyan-400">Monetización</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configura si tu contenido será gratuito o de pago
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_free" className="text-base">
                          Contenido Gratuito
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {formData.is_free 
                            ? "El contenido será visible para todos sin costo" 
                            : "Los usuarios deberán pagar para acceder al contenido"}
                        </p>
                      </div>
                      <Switch
                        id="is_free"
                        checked={formData.is_free}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, is_free: checked }))
                        }
                      />
                    </div>

                    {!formData.is_free && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-card/50">
                        <div className="space-y-2">
                          <Label htmlFor="price">Precio *</Label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency">Moneda</Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona moneda" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - Dólar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                              <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                              <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                              <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-cyan-400">Ficha Técnica</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="band_name">Banda</Label>
                        {!showOtherBand ? (
                          <Select
                            value={formData.band_name}
                            onValueChange={(value) => {
                              if (value === "__otro__") {
                                setShowOtherBand(true);
                                setFormData(prev => ({ ...prev, band_name: "" }));
                              } else {
                                setFormData(prev => ({ ...prev, band_name: value }));
                              }
                            }}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Selecciona una banda" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border z-50">
                              {bands.map((band) => (
                                <SelectItem key={band.id} value={band.display_name}>
                                  {band.display_name}
                                </SelectItem>
                              ))}
                              <SelectItem value="__otro__" className="text-cyan-400 font-semibold">
                                ✏️ Otro (escribir manualmente)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={formData.band_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, band_name: e.target.value }))}
                              placeholder="Escribe el nombre de la banda"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowOtherBand(false);
                                setFormData(prev => ({ ...prev, band_name: "" }));
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="producer_name">Productor Artístico</Label>
                        {!showOtherProducer ? (
                          <Select
                            value={formData.producer_name}
                            onValueChange={(value) => {
                              if (value === "__otro__") {
                                setShowOtherProducer(true);
                                setFormData(prev => ({ ...prev, producer_name: "" }));
                              } else {
                                setFormData(prev => ({ ...prev, producer_name: value }));
                              }
                            }}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Selecciona un productor" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border z-50">
                              {producers.map((producer) => (
                                <SelectItem key={producer.id} value={producer.display_name}>
                                  {producer.display_name}
                                </SelectItem>
                              ))}
                              <SelectItem value="__otro__" className="text-cyan-400 font-semibold">
                                ✏️ Otro (escribir manualmente)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={formData.producer_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, producer_name: e.target.value }))}
                              placeholder="Escribe el nombre del productor"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowOtherProducer(false);
                                setFormData(prev => ({ ...prev, producer_name: "" }));
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recording_studio">Estudio de Grabación</Label>
                        {!showOtherStudio ? (
                          <Select
                            value={formData.recording_studio}
                            onValueChange={(value) => {
                              if (value === "__otro__") {
                                setShowOtherStudio(true);
                                setFormData(prev => ({ ...prev, recording_studio: "" }));
                              } else {
                                setFormData(prev => ({ ...prev, recording_studio: value }));
                              }
                            }}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Selecciona un estudio" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border z-50">
                              {studios.map((studio) => (
                                <SelectItem key={studio.id} value={studio.display_name}>
                                  {studio.display_name}
                                </SelectItem>
                              ))}
                              <SelectItem value="__otro__" className="text-cyan-400 font-semibold">
                                ✏️ Otro (escribir manualmente)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={formData.recording_studio}
                              onChange={(e) => setFormData(prev => ({ ...prev, recording_studio: e.target.value }))}
                              placeholder="Escribe el nombre del estudio"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowOtherStudio(false);
                                setFormData(prev => ({ ...prev, recording_studio: "" }));
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venue_name">Sala / Venue</Label>
                        {!showOtherVenue ? (
                          <Select
                            value={formData.venue_name}
                            onValueChange={(value) => {
                              if (value === "__otro__") {
                                setShowOtherVenue(true);
                                setFormData(prev => ({ ...prev, venue_name: "" }));
                              } else {
                                setFormData(prev => ({ ...prev, venue_name: value }));
                              }
                            }}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Selecciona una sala" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border z-50">
                              {venues.map((venue) => (
                                <SelectItem key={venue.id} value={venue.display_name}>
                                  {venue.display_name}
                                </SelectItem>
                              ))}
                              <SelectItem value="__otro__" className="text-cyan-400 font-semibold">
                                ✏️ Otro (escribir manualmente)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={formData.venue_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
                              placeholder="Escribe el nombre de la sala"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowOtherVenue(false);
                                setFormData(prev => ({ ...prev, venue_name: "" }));
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="promoter_name">Promotor Artístico</Label>
                        {!showOtherPromoter ? (
                          <Select
                            value={formData.promoter_name}
                            onValueChange={(value) => {
                              if (value === "__otro__") {
                                setShowOtherPromoter(true);
                                setFormData(prev => ({ ...prev, promoter_name: "" }));
                              } else {
                                setFormData(prev => ({ ...prev, promoter_name: value }));
                              }
                            }}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Selecciona un promotor" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border z-50">
                              {promoters.map((promoter) => (
                                <SelectItem key={promoter.id} value={promoter.display_name}>
                                  {promoter.display_name}
                                </SelectItem>
                              ))}
                              <SelectItem value="__otro__" className="text-cyan-400 font-semibold">
                                ✏️ Otro (escribir manualmente)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={formData.promoter_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, promoter_name: e.target.value }))}
                              placeholder="Escribe el nombre del promotor"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowOtherPromoter(false);
                                setFormData(prev => ({ ...prev, promoter_name: "" }));
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      "Subir Contenido"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UploadContent;
