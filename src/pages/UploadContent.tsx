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

const UploadContent = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [formData, setFormData] = useState({
    content_type: "",
    title: "",
    description: "",
    video_url: "",
    audio_url: "",
    podcast_category: "",
    band_name: "",
    producer_name: "",
    recording_studio: "",
    venue_name: "",
    promoter_name: "",
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
  }, []);

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
        status: 'pending'
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
        podcast_category: "",
        band_name: "",
        producer_name: "",
        recording_studio: "",
        venue_name: "",
        promoter_name: "",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                <CardTitle className="text-2xl">Subir Contenido</CardTitle>
                <CardDescription>
                  Comparte tu contenido con la comunidad
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

                  {formData.content_type !== 'podcast' && (
                    <div className="space-y-2">
                      <Label htmlFor="video_url">URL del video</Label>
                      <Input
                        id="video_url"
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleChange}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  )}

                  {formData.content_type === 'podcast' && (
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
                  )}

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Ficha Técnica (opcional)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="band_name">Banda</Label>
                        <Input
                          id="band_name"
                          name="band_name"
                          value={formData.band_name}
                          onChange={handleChange}
                          placeholder="Nombre de la banda"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="producer_name">Productor Artístico</Label>
                        <Input
                          id="producer_name"
                          name="producer_name"
                          value={formData.producer_name}
                          onChange={handleChange}
                          placeholder="Nombre del productor"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recording_studio">Estudio de Grabación</Label>
                        <Input
                          id="recording_studio"
                          name="recording_studio"
                          value={formData.recording_studio}
                          onChange={handleChange}
                          placeholder="Nombre del estudio"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venue_name">Sala / Venue</Label>
                        <Input
                          id="venue_name"
                          name="venue_name"
                          value={formData.venue_name}
                          onChange={handleChange}
                          placeholder="Nombre de la sala"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="promoter_name">Promotor Artístico</Label>
                        <Input
                          id="promoter_name"
                          name="promoter_name"
                          value={formData.promoter_name}
                          onChange={handleChange}
                          placeholder="Nombre del promotor"
                        />
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
