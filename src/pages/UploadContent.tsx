import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
import { Loader2, AlertCircle, Eye, Play, Music, ImageIcon, Clock, MonitorPlay, HardDrive } from "lucide-react";
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
import { VideoUpload } from "@/components/VideoUpload";
import { AudioUpload } from "@/components/AudioUpload";
import { ImageUpload } from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ServiceWorkerStatus } from "@/components/ServiceWorkerStatus";
import { ThumbnailPreloadStatus } from "@/components/ThumbnailPreloadStatus";

interface ProfileOption {
  id: string;
  display_name: string;
}

const UploadContent = () => {
  const { t } = useTranslation();
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
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    content_type: "",
    title: "",
    description: "",
    video_url: "",
    audio_url: "",
    photo_url: "",
    thumbnail_url: "",
    custom_thumbnail_url: "",
    podcast_category: "",
    band_name: "",
    producer_name: "",
    recording_studio: "",
    venue_name: "",
    promoter_name: "",
    is_free: true,
    price: "0",
    currency: "USD",
    video_width: 0,
    video_height: 0,
    file_size: 0,
    video_duration_seconds: 0,
    audio_duration_seconds: 0,
  });

  const contentTypes = useMemo(() => [
    { value: "video_musical_vivo", label: t('upload.contentTypes.video_musical_vivo') },
    { value: "video_clip", label: t('upload.contentTypes.video_clip') },
    { value: "podcast", label: t('upload.contentTypes.podcast') },
    { value: "documental", label: t('upload.contentTypes.documental') },
    { value: "corto", label: t('upload.contentTypes.corto') },
    { value: "pelicula", label: t('upload.contentTypes.pelicula') }
  ], [t]);

  const podcastCategories = useMemo(() => [
    { value: "produccion", label: t('upload.podcastCategories.produccion') },
    { value: "marketing_digital", label: t('upload.podcastCategories.marketing_digital') },
    { value: "derecho_autor", label: t('upload.podcastCategories.derecho_autor') },
    { value: "management", label: t('upload.podcastCategories.management') },
    { value: "composicion", label: t('upload.podcastCategories.composicion') }
  ], [t]);

  useEffect(() => {
    checkUserProfile();
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      // Cargar bandas
      const { data: bandsData } = await supabase
        .from('public_profiles')
        .select('id, display_name')
        .eq('profile_type', 'agrupacion_musical')
        .order('display_name');
      
      // Cargar productores artísticos
      const { data: producersData } = await supabase
        .from('public_profiles')
        .select('id, display_name')
        .eq('profile_type', 'productor_artistico')
        .order('display_name');
      
      // Cargar estudios de grabación
      const { data: studiosData } = await supabase
        .from('public_profiles')
        .select('id, display_name')
        .eq('profile_type', 'estudio_grabacion')
        .order('display_name');
      
      // Cargar salas/venues
      const { data: venuesData } = await supabase
        .from('public_profiles')
        .select('id, display_name')
        .eq('profile_type', 'sala_concierto')
        .order('display_name');
      
      // Cargar promotores artísticos
      const { data: promotersData } = await supabase
        .from('public_profiles')
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
    
    // Validaciones antes de enviar
    if (!formData.content_type) {
      toast({
        title: t('upload.validationError'),
        description: t('upload.selectContentTypeError'),
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: t('upload.validationError'),
        description: t('upload.enterTitleError'),
        variant: "destructive",
      });
      return;
    }

    // Validar que al menos un archivo sea subido
    if (formData.content_type === 'podcast') {
      if (!formData.audio_url) {
        toast({
          title: t('upload.validationError'),
          description: t('upload.uploadAudioError'),
          variant: "destructive",
        });
        return;
      }
      if (!formData.podcast_category) {
        toast({
          title: t('upload.validationError'),
          description: t('upload.selectCategoryError'),
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.video_url && !formData.photo_url) {
        toast({
          title: t('upload.validationError'),
          description: t('upload.uploadMediaError'),
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t('common.error'),
          description: t('upload.loginRequired'),
          variant: "destructive",
        });
        setLoading(false);
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
        // Priorizar miniatura personalizada sobre la extraída del video
        thumbnail_url: formData.custom_thumbnail_url || formData.thumbnail_url || null,
        status: 'pending',
        is_free: formData.is_free,
        price: formData.is_free ? 0 : parseFloat(formData.price) || 0,
        currency: formData.currency,
        video_width: formData.video_width || null,
        video_height: formData.video_height || null,
        file_size: formData.file_size || null,
        video_duration_seconds: formData.video_duration_seconds || null,
        audio_duration_seconds: formData.audio_duration_seconds || null,
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
        title: t('upload.contentUploaded'),
        description: t('upload.contentUploadedDesc'),
      });

      // Limpiar formulario
      setFormData({
        content_type: "",
        title: "",
        description: "",
        video_url: "",
        audio_url: "",
        photo_url: "",
        thumbnail_url: "",
        custom_thumbnail_url: "",
        podcast_category: "",
        band_name: "",
        producer_name: "",
        recording_studio: "",
        venue_name: "",
        promoter_name: "",
        is_free: true,
        price: "0",
        currency: "USD",
        video_width: 0,
        video_height: 0,
        file_size: 0,
        video_duration_seconds: 0,
        audio_duration_seconds: 0,
      });
    } catch (error: any) {
      console.error('Error al subir contenido:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('upload.uploadError'),
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

  const getContentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      video_musical_vivo: t('upload.contentTypes.video_musical_vivo'),
      video_clip: t('upload.contentTypes.video_clip'),
      podcast: t('upload.contentTypes.podcast'),
      documental: t('upload.contentTypes.documental'),
      corto: t('upload.contentTypes.corto'),
      pelicula: t('upload.contentTypes.pelicula')
    };
    return labels[type] || type;
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

  const handlePreview = () => {
    // Validar que haya contenido mínimo para vista previa
    if (!formData.content_type) {
      toast({
        title: t('upload.missingInfo'),
        description: t('upload.selectTypePreview'),
        variant: "destructive",
      });
      return;
    }
    if (!formData.title.trim()) {
      toast({
        title: t('upload.missingInfo'),
        description: t('upload.enterTitlePreview'),
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
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
                <CardTitle className="text-2xl">{t('upload.associationRequired')}</CardTitle>
                <CardDescription>
                  {t('upload.associationRequiredDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('upload.noProfile')}</AlertTitle>
                  <AlertDescription>
                    {t('upload.noProfileDesc')}
                  </AlertDescription>
                </Alert>
                <div className="mt-6 flex gap-4">
                  <Button onClick={() => navigate("/asociate")} className="flex-1">
                    {t('upload.joinNow')}
                  </Button>
                  <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                    {t('upload.backToHome')}
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
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Service Worker Status */}
            <ServiceWorkerStatus />
            
            {/* Thumbnail Preload Status */}
            <ThumbnailPreloadStatus />
            
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400">{t('upload.title')}</CardTitle>
                <CardDescription>
                  {t('upload.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="content_type">{t('upload.contentType')} *</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('upload.selectContentType')} />
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
                      <Label htmlFor="podcast_category">{t('upload.podcastCategory')} *</Label>
                      <Select
                        value={formData.podcast_category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, podcast_category: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('upload.selectCategory')} />
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
                    <Label htmlFor="band_name">{t('upload.artist')} *</Label>
                    <Input
                      id="band_name"
                      name="band_name"
                      required
                      value={formData.band_name}
                      onChange={handleChange}
                      placeholder={t('upload.artistPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {formData.content_type === 'video_musical_vivo' ? t('upload.songTitle') + ' *' : t('upload.contentTitle') + ' *'}
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder={formData.content_type === 'video_musical_vivo' ? t('upload.songPlaceholder') : t('upload.contentPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('upload.description')}</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder={t('upload.descriptionPlaceholder')}
                      className="min-h-32"
                    />
                  </div>

                  {/* Sección de Video */}
                  {formData.content_type !== 'podcast' && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.video')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('upload.videoDesc')}
                        </p>
                      </div>
                      <VideoUpload
                        label={t('upload.video')}
                        value={formData.video_url}
                        onChange={(url) => setFormData(prev => ({ ...prev, video_url: url }))}
                        onMetadataExtracted={(metadata) => setFormData(prev => ({
                          ...prev,
                          thumbnail_url: metadata.thumbnail,
                          video_width: metadata.width,
                          video_height: metadata.height,
                          file_size: metadata.size,
                          video_duration_seconds: metadata.duration
                        }))}
                        description={t('upload.videoUploadDesc')}
                      />
                    </div>
                  )}

                  {/* Sección de Miniatura Personalizada - estilo YouTube */}
                  {formData.content_type !== 'podcast' && formData.video_url && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.customThumbnail')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('upload.customThumbnailDesc')}
                        </p>
                      </div>
                      
                      {/* Preview de miniaturas */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Miniatura extraída del video */}
                        {formData.thumbnail_url && (
                          <div 
                            className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                              !formData.custom_thumbnail_url 
                                ? 'border-cyan-400 ring-2 ring-cyan-400/30' 
                                : 'border-border hover:border-muted-foreground'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, custom_thumbnail_url: "" }))}
                          >
                            <div className="aspect-video">
                              <img 
                                src={formData.thumbnail_url} 
                                alt={t('upload.videoFrame')} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                              <p className="text-xs text-white text-center">{t('upload.videoFrame')}</p>
                            </div>
                            {!formData.custom_thumbnail_url && (
                              <div className="absolute top-2 right-2 bg-cyan-400 text-black text-xs px-2 py-1 rounded font-semibold">
                                {t('upload.selected')}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Miniatura personalizada */}
                        <div 
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            formData.custom_thumbnail_url 
                              ? 'border-cyan-400 ring-2 ring-cyan-400/30' 
                              : 'border-dashed border-border'
                          }`}
                        >
                          {formData.custom_thumbnail_url ? (
                            <>
                              <div className="aspect-video">
                                <img 
                                  src={formData.custom_thumbnail_url} 
                                  alt={t('upload.customThumbnailLabel')} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                                <p className="text-xs text-white text-center">{t('upload.customThumbnailLabel')}</p>
                              </div>
                              <div className="absolute top-2 right-2 bg-cyan-400 text-black text-xs px-2 py-1 rounded font-semibold">
                                {t('upload.selected')}
                              </div>
                            </>
                          ) : (
                            <div className="aspect-video flex flex-col items-center justify-center bg-card/50 p-4">
                              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                              <p className="text-xs text-muted-foreground text-center">{t('upload.uploadThumbnail')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <ImageUpload
                        label={t('upload.uploadCustomThumbnail')}
                        value={formData.custom_thumbnail_url}
                        onChange={(url) => setFormData(prev => ({ ...prev, custom_thumbnail_url: url }))}
                        description={t('upload.thumbnailDesc')}
                      />
                    </div>
                  )}

                  {/* Sección de Fotografía */}
                  {formData.content_type !== 'podcast' && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.photography')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('upload.photographyDesc')}
                        </p>
                      </div>
                      <ImageUpload
                        label={t('upload.photography')}
                        value={formData.photo_url}
                        onChange={(url) => setFormData(prev => ({ ...prev, photo_url: url }))}
                        description={t('upload.photoUploadDesc')}
                      />
                    </div>
                  )}

                  {formData.content_type === 'podcast' && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.audio')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('upload.audioDesc')}
                        </p>
                      </div>
                      <AudioUpload
                        label={t('upload.audio')}
                        value={formData.audio_url}
                        onChange={(url) => setFormData(prev => ({ ...prev, audio_url: url }))}
                        onMetadataExtracted={(metadata) => setFormData(prev => ({
                          ...prev,
                          file_size: metadata.size,
                          audio_duration_seconds: metadata.duration
                        }))}
                        required
                        description={t('upload.audioUploadDesc')}
                      />
                    </div>
                  )}

                  {/* Sección de Monetización */}
                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.monetization')}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('upload.monetizationDesc')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_free" className="text-base">
                          {t('upload.freeContent')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {formData.is_free 
                            ? t('upload.freeContentDesc')
                            : t('upload.paidContentDesc')}
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
                          <Label htmlFor="price">{t('upload.price')} *</Label>
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
                          <Label htmlFor="currency">{t('upload.currency')}</Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('upload.selectCurrency')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - Dollar</SelectItem>
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
                    <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                      {formData.content_type === 'video_musical_vivo' ? t('upload.artistInfo') : t('upload.technicalSheet')}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="band_name">
                          {formData.content_type === 'video_musical_vivo' ? t('upload.artist') + ' *' : t('upload.band')}
                        </Label>
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
                              <SelectValue placeholder={formData.content_type === 'video_musical_vivo' ? t('upload.selectArtist') : t('upload.selectBand')} />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border z-50">
                              {bands.map((band) => (
                                <SelectItem key={band.id} value={band.display_name}>
                                  {band.display_name}
                                </SelectItem>
                              ))}
                              <SelectItem value="__otro__" className="text-cyan-400 font-semibold">
                                ✏️ {t('upload.other')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={formData.band_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, band_name: e.target.value }))}
                              placeholder={formData.content_type === 'video_musical_vivo' ? t('upload.writeArtist') : t('upload.writeBand')}
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

                      {formData.content_type !== 'video_musical_vivo' && (
                        <div className="space-y-2">
                          <Label htmlFor="producer_name">{t('upload.producer')}</Label>
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
                                <SelectValue placeholder={t('upload.selectProducer')} />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border z-50">
                                {producers.map((producer) => (
                                  <SelectItem key={producer.id} value={producer.display_name}>
                                    {producer.display_name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__otro__" className="text-cyan-400 font-semibold">
                                  ✏️ {t('upload.other')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                          <div className="flex gap-2">
                            <Input
                              value={formData.producer_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, producer_name: e.target.value }))}
                              placeholder={t('upload.writeProducer')}
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
                      )}

                      {formData.content_type !== 'video_musical_vivo' && (
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
                      )}

                      {formData.content_type !== 'video_musical_vivo' && (
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
                      )}

                      {formData.content_type !== 'video_musical_vivo' && (
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
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      className="flex-1" 
                      size="lg"
                      onClick={handlePreview}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t('upload.preview')}
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('upload.uploading')}
                        </>
                      ) : (
                        t('upload.uploadContent')
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Vista Previa */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('upload.previewTitle')}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('upload.previewDesc')}
              </p>
              
              <Card className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors overflow-hidden">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {formData.thumbnail_url || formData.photo_url ? (
                    <img 
                      src={formData.thumbnail_url || formData.photo_url || ''} 
                      alt={formData.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {formData.video_url && <Play className="w-16 h-16 text-muted-foreground" />}
                      {formData.audio_url && !formData.video_url && <Music className="w-16 h-16 text-muted-foreground" />}
                      {formData.photo_url && !formData.video_url && !formData.audio_url && <ImageIcon className="w-16 h-16 text-muted-foreground" />}
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="backdrop-blur-sm">
                      {getContentTypeLabel(formData.content_type)}
                    </Badge>
                  </div>

                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="backdrop-blur-sm">
                      {t('upload.pending')}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1 text-foreground">
                      {formData.title || t('upload.noTitle')}
                    </h3>
                    {formData.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {formData.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    {formData.video_width && formData.video_height && (
                      <div className="flex items-center gap-2">
                        <MonitorPlay className="w-4 h-4" />
                        <span>{formData.video_width}x{formData.video_height}</span>
                      </div>
                    )}
                    
                    {(formData.video_duration_seconds || formData.audio_duration_seconds) > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatDuration(formData.video_duration_seconds || formData.audio_duration_seconds)}
                        </span>
                      </div>
                    )}
                    
                    {formData.file_size > 0 && (
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        <span>{formatFileSize(formData.file_size)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      {formData.video_url && <Play className="w-4 h-4 mr-2" />}
                      {formData.audio_url && !formData.video_url && <Music className="w-4 h-4 mr-2" />}
                      {formData.photo_url && !formData.video_url && !formData.audio_url && <ImageIcon className="w-4 h-4 mr-2" />}
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowPreview(false)}
                >
                  {t('upload.continueEditing')}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setShowPreview(false);
                    document.querySelector('form')?.requestSubmit();
                  }}
                  disabled={loading}
                >
                  {t('upload.publishNow')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default UploadContent;
