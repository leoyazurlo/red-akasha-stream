import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { Loader2, AlertCircle, Eye, FileText, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VideoUpload } from "@/components/VideoUpload";
import { AudioUpload } from "@/components/AudioUpload";
import { ImageUpload } from "@/components/ImageUpload";
import { ProfileSelect } from "@/components/upload/ProfileSelect";
import { ContentPreviewDialog } from "@/components/upload/ContentPreviewDialog";
import { MonetizationSection } from "@/components/upload/MonetizationSection";
import { ThumbnailSelector } from "@/components/upload/ThumbnailSelector";

interface ProfileOption {
  id: string;
  display_name: string;
}

interface FormData {
  content_type: string;
  title: string;
  description: string;
  video_url: string;
  audio_url: string;
  photo_url: string;
  thumbnail_url: string;
  custom_thumbnail_url: string;
  podcast_category: string;
  band_name: string;
  producer_name: string;
  recording_studio: string;
  venue_name: string;
  promoter_name: string;
  is_free: boolean;
  price: string;
  currency: string;
  video_width: number;
  video_height: number;
  file_size: number;
  video_duration_seconds: number;
  audio_duration_seconds: number;
}

const initialFormData: FormData = {
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
};

const UploadContent = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const termsScrollRef = useRef<HTMLDivElement>(null);
  
  // Profile options
  const [bands, setBands] = useState<ProfileOption[]>([]);
  const [producers, setProducers] = useState<ProfileOption[]>([]);
  const [studios, setStudios] = useState<ProfileOption[]>([]);
  const [venues, setVenues] = useState<ProfileOption[]>([]);
  const [promoters, setPromoters] = useState<ProfileOption[]>([]);

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

  const isVideoMusicalVivo = formData.content_type === 'video_musical_vivo';
  const isPodcast = formData.content_type === 'podcast';

  useEffect(() => {
    checkUserProfile();
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const [bandsRes, producersRes, studiosRes, venuesRes, promotersRes] = await Promise.all([
        supabase.from('public_profiles').select('id, display_name').eq('profile_type', 'agrupacion_musical').order('display_name'),
        supabase.from('public_profiles').select('id, display_name').eq('profile_type', 'productor_artistico').order('display_name'),
        supabase.from('public_profiles').select('id, display_name').eq('profile_type', 'estudio_grabacion').order('display_name'),
        supabase.from('public_profiles').select('id, display_name').eq('profile_type', 'sala_concierto').order('display_name'),
        supabase.from('public_profiles').select('id, display_name').eq('profile_type', 'promotor_artistico').order('display_name'),
      ]);

      setBands(bandsRes.data || []);
      setProducers(producersRes.data || []);
      setStudios(studiosRes.data || []);
      setVenues(venuesRes.data || []);
      setPromoters(promotersRes.data || []);
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
      setHasProfile(data && data.length > 0);
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getContentTypeLabel = (type: string): string => {
    const found = contentTypes.find(ct => ct.value === type);
    return found?.label || type;
  };

  const validateForm = (): boolean => {
    if (!formData.content_type) {
      toast({
        title: t('upload.validationError'),
        description: t('upload.selectContentTypeError'),
        variant: "destructive",
      });
      return false;
    }

    if (!formData.title.trim()) {
      toast({
        title: t('upload.validationError'),
        description: t('upload.enterTitleError'),
        variant: "destructive",
      });
      return false;
    }

    if (!formData.band_name.trim()) {
      toast({
        title: t('upload.validationError'),
        description: t('upload.selectArtistError') || 'Selecciona un artista',
        variant: "destructive",
      });
      return false;
    }

    if (!acceptedTerms) {
      toast({
        title: t('upload.validationError'),
        description: t('upload.acceptTermsError') || 'Debes aceptar los términos y condiciones',
        variant: "destructive",
      });
      return false;
    }

    if (isPodcast) {
      if (!formData.audio_url) {
        toast({
          title: t('upload.validationError'),
          description: t('upload.uploadAudioError'),
          variant: "destructive",
        });
        return false;
      }
      if (!formData.podcast_category) {
        toast({
          title: t('upload.validationError'),
          description: t('upload.selectCategoryError'),
          variant: "destructive",
        });
        return false;
      }
    } else {
      if (!formData.video_url && !formData.photo_url) {
        toast({
          title: t('upload.validationError'),
          description: t('upload.uploadMediaError'),
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

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

      const { error } = await supabase.from('content_uploads').insert({
        uploader_id: user.id,
        content_type: formData.content_type as "corto" | "documental" | "pelicula" | "podcast" | "video_clip" | "video_musical_vivo",
        title: formData.title,
        description: formData.description || null,
        video_url: formData.video_url || null,
        audio_url: formData.audio_url || null,
        photo_url: formData.photo_url || null,
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
        band_name: formData.band_name || null,
        producer_name: formData.producer_name || null,
        recording_studio: formData.recording_studio || null,
        venue_name: formData.venue_name || null,
        promoter_name: formData.promoter_name || null,
        podcast_category: isPodcast ? (formData.podcast_category as "produccion" | "marketing_digital" | "derecho_autor" | "management" | "composicion" || null) : null,
      });

      if (error) throw error;
      
      toast({
        title: t('upload.contentUploaded'),
        description: t('upload.contentUploadedDesc'),
      });

      setFormData(initialFormData);
    } catch (error: unknown) {
      console.error('Error al subir contenido:', error);
      toast({
        title: t('common.error'),
        description: (error as Error).message || t('upload.uploadError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
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

  const handlePublish = () => {
    setShowPreview(false);
    document.querySelector('form')?.requestSubmit();
  };

  // Loading state
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

  // No profile state
  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-background">
        <CosmicBackground />
        <Header />
        <main className="relative pt-24 pb-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto border-cyan-400 bg-card/50 backdrop-blur-sm shadow-[0_0_25px_hsl(180_100%_50%/0.4),0_0_50px_hsl(180_100%_50%/0.2)]">
              <CardHeader>
                <CardTitle className="text-2xl">{t('upload.associationRequired')}</CardTitle>
                <CardDescription>{t('upload.associationRequiredDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('upload.noProfile')}</AlertTitle>
                  <AlertDescription>{t('upload.noProfileDesc')}</AlertDescription>
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
            <Card className="border-cyan-400 bg-card/50 backdrop-blur-sm shadow-[0_0_25px_hsl(180_100%_50%/0.4),0_0_50px_hsl(180_100%_50%/0.2)]">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400">{t('upload.title')}</CardTitle>
                <CardDescription>{t('upload.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Content Type */}
                  <div className="space-y-2">
                    <Label htmlFor="content_type">{t('upload.contentType')} *</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(value) => updateFormData('content_type', value)}
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

                  {/* Podcast Category */}
                  {isPodcast && (
                    <div className="space-y-2">
                      <Label htmlFor="podcast_category">{t('upload.podcastCategory')} *</Label>
                      <Select
                        value={formData.podcast_category}
                        onValueChange={(value) => updateFormData('podcast_category', value)}
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

                  {/* Artist / Band */}
                  <ProfileSelect
                    label={isVideoMusicalVivo ? t('upload.artist') : t('upload.band')}
                    placeholder={isVideoMusicalVivo ? t('upload.selectArtist') : t('upload.selectBand')}
                    writePlaceholder={isVideoMusicalVivo ? t('upload.writeArtist') : t('upload.writeBand')}
                    value={formData.band_name}
                    options={bands}
                    onChange={(value) => updateFormData('band_name', value)}
                    required
                  />

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {isVideoMusicalVivo ? t('upload.songTitle') + ' *' : t('upload.contentTitle') + ' *'}
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder={isVideoMusicalVivo ? t('upload.songPlaceholder') : t('upload.contentPlaceholder')}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('upload.description')}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder={t('upload.descriptionPlaceholder')}
                      className="min-h-32"
                    />
                  </div>

                  {/* Video Upload Section */}
                  {!isPodcast && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.video')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('upload.videoDesc')}</p>
                      </div>
                      <VideoUpload
                        label={t('upload.video')}
                        value={formData.video_url}
                        onChange={(url) => updateFormData('video_url', url)}
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

                  {/* Thumbnail Selector */}
                  {!isPodcast && formData.video_url && (
                    <ThumbnailSelector
                      videoThumbnail={formData.thumbnail_url}
                      customThumbnail={formData.custom_thumbnail_url}
                      onCustomThumbnailChange={(url) => updateFormData('custom_thumbnail_url', url)}
                    />
                  )}

                  {/* Photo Upload Section */}
                  {!isPodcast && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.photography')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('upload.photographyDesc')}</p>
                      </div>
                      <ImageUpload
                        label={t('upload.photography')}
                        value={formData.photo_url}
                        onChange={(url) => updateFormData('photo_url', url)}
                        description={t('upload.photoUploadDesc')}
                      />
                    </div>
                  )}

                  {/* Audio Upload Section */}
                  {isPodcast && (
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.audio')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('upload.audioDesc')}</p>
                      </div>
                      <AudioUpload
                        label={t('upload.audio')}
                        value={formData.audio_url}
                        onChange={(url) => updateFormData('audio_url', url)}
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

                  {/* Monetization Section */}
                  <MonetizationSection
                    isFree={formData.is_free}
                    price={formData.price}
                    currency={formData.currency}
                    onIsFreeChange={(value) => updateFormData('is_free', value)}
                    onPriceChange={(value) => updateFormData('price', value)}
                    onCurrencyChange={(value) => updateFormData('currency', value)}
                  />

                  {/* Technical Sheet - Only for non-video_musical_vivo */}
                  {!isVideoMusicalVivo && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4 text-cyan-400">{t('upload.technicalSheet')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProfileSelect
                          label={t('upload.producer')}
                          placeholder={t('upload.selectProducer')}
                          writePlaceholder={t('upload.writeProducer') || 'Escribe el nombre del productor'}
                          value={formData.producer_name}
                          options={producers}
                          onChange={(value) => updateFormData('producer_name', value)}
                        />
                        <ProfileSelect
                          label={t('upload.studio')}
                          placeholder={t('upload.selectStudio')}
                          writePlaceholder={t('upload.writeStudio') || 'Escribe el nombre del estudio'}
                          value={formData.recording_studio}
                          options={studios}
                          onChange={(value) => updateFormData('recording_studio', value)}
                        />
                        <ProfileSelect
                          label={t('upload.venue')}
                          placeholder={t('upload.selectVenue')}
                          writePlaceholder={t('upload.writeVenue') || 'Escribe el nombre del venue'}
                          value={formData.venue_name}
                          options={venues}
                          onChange={(value) => updateFormData('venue_name', value)}
                        />
                        <ProfileSelect
                          label={t('upload.promoter')}
                          placeholder={t('upload.selectPromoter')}
                          writePlaceholder={t('upload.writePromoter') || 'Escribe el nombre del promotor'}
                          value={formData.promoter_name}
                          options={promoters}
                          onChange={(value) => updateFormData('promoter_name', value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Terms and Conditions */}
                  <div className="border-t pt-6">
                    <Collapsible
                      open={termsOpen}
                      onOpenChange={setTermsOpen}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center justify-between w-full p-4 bg-card/50 border border-cyan-400/50 rounded-lg hover:bg-card/70 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-cyan-400 font-medium">
                            <FileText className="h-5 w-5" />
                            {t('upload.termsTitle') || 'Términos y Condiciones del Servicio'}
                          </span>
                          <ChevronDown className={`h-5 w-5 text-cyan-400 transition-transform duration-200 ${termsOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 border border-cyan-400/30 rounded-lg bg-card/30">
                          <p className="p-3 text-sm text-muted-foreground border-b border-cyan-400/20 bg-cyan-400/5">
                            {t('upload.termsSubtitle') || 'Por favor lee cuidadosamente hasta el final para poder aceptar los términos'}
                          </p>
                          <div 
                            ref={termsScrollRef}
                            className="h-[300px] overflow-y-auto p-4"
                            onScroll={(e) => {
                              const target = e.target as HTMLDivElement;
                              const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 20;
                              if (isAtBottom && !hasScrolledToEnd) {
                                setHasScrolledToEnd(true);
                              }
                            }}
                          >
                            <div className="space-y-4 text-sm text-muted-foreground">
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">1. Aceptación de los Términos</h3>
                                <p>Al asociarte y subir contenido a Red Akasha.org, aceptás cumplir con estos términos y condiciones. Si no estás de acuerdo con alguno de ellos, no debés subir contenido a la plataforma.</p>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">2. Propiedad del Contenido</h3>
                                <ul className="list-disc ml-6 space-y-1">
                                  <li>Declarás y garantizás que sos el propietario legítimo o que contás con los derechos necesarios para subir, publicar y distribuir el contenido.</li>
                                  <li>Todo material que subas (podcasts, videos musicales, videoclips, documentales, películas, etc.) debe ser de tu autoría o contar con autorización expresa.</li>
                                  <li>Mantenés todos los derechos de propiedad intelectual sobre tu contenido original.</li>
                                </ul>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">3. Licencia de Uso</h3>
                                <p>Al subir contenido, otorgás a Red Akasha una licencia no exclusiva, mundial y libre de regalías para mostrar, distribuir y promocionar tu contenido dentro de la plataforma, con el único fin de operar y mejorar el servicio.</p>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">4. Veracidad de los Datos</h3>
                                <ul className="list-disc ml-6 space-y-1">
                                  <li>La información que proporciones al registrarte y al publicar contenido debe ser real, completa y verificable.</li>
                                  <li>La plataforma no se responsabiliza por datos falsos o inexactos ingresados por los usuarios.</li>
                                </ul>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">5. Contenido Prohibido</h3>
                                <p>No está permitido subir contenido que:</p>
                                <ul className="list-disc ml-6 mt-2 space-y-1">
                                  <li>Infrinja derechos de autor, marcas registradas u otros derechos de propiedad intelectual.</li>
                                  <li>Contenga material ilegal, difamatorio, obsceno, violento o que incite al odio.</li>
                                  <li>Incluya virus, malware o cualquier código malicioso.</li>
                                  <li>Viole la privacidad de terceros.</li>
                                  <li>Sea engañoso o fraudulento.</li>
                                </ul>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">6. Moderación de Contenido</h3>
                                <p>Red Akasha se reserva el derecho de revisar, aprobar, rechazar o eliminar cualquier contenido que viole estos términos o que considere inapropiado para la comunidad.</p>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">7. Responsabilidad del Usuario</h3>
                                <ul className="list-disc ml-6 space-y-1">
                                  <li>Sos el único responsable del contenido que publicás y de las consecuencias derivadas de su difusión.</li>
                                  <li>Red Akasha.org no se hace responsable por reclamos, daños o perjuicios ocasionados por el uso indebido del material subido.</li>
                                </ul>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">8. Monetización</h3>
                                <p>Si optás por monetizar tu contenido, aceptás las políticas de pago y comisiones establecidas por la plataforma. Los pagos estarán sujetos a las leyes fiscales aplicables.</p>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">9. Colaboración y Comunidad</h3>
                                <ul className="list-disc ml-6 space-y-1">
                                  <li>Al participar, aceptás que tu aporte forma parte de un proyecto colectivo que busca fortalecer la industria cultural de habla hispana.</li>
                                  <li>Tu colaboración ayuda a construir un espacio transparente, democrático y responsable para artistas emergentes y consumidores de buen contenido.</li>
                                </ul>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">10. Modificaciones</h3>
                                <p>Red Akasha puede modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación. El uso continuado del servicio constituye aceptación de los nuevos términos.</p>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">11. Terminación</h3>
                                <p>Podés eliminar tu contenido en cualquier momento. Red Akasha puede suspender o terminar tu acceso si violás estos términos.</p>
                              </section>
                              
                              <section>
                                <h3 className="font-semibold text-foreground mb-2">12. Contacto</h3>
                                <p>Para consultas sobre estos términos, comunicate a través de los canales oficiales de Red Akasha.org.</p>
                              </section>
                            </div>
                          </div>
                          
                          {/* Checkbox at the bottom - only enabled after scrolling */}
                          <div className="p-4 border-t border-cyan-400/20 bg-cyan-400/5">
                            <div className="flex items-start space-x-3">
                              <Checkbox 
                                id="terms" 
                                checked={acceptedTerms}
                                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                                disabled={!hasScrolledToEnd}
                                className="mt-1 border-cyan-400 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <div className="text-sm">
                                <label 
                                  htmlFor="terms" 
                                  className={`cursor-pointer ${hasScrolledToEnd ? 'text-foreground' : 'text-muted-foreground/50'}`}
                                >
                                  {hasScrolledToEnd 
                                    ? (t('upload.acceptTerms') || 'Acepto los Términos y Condiciones y la política de privacidad del servicio') + ' *'
                                    : (t('upload.scrollToAccept') || 'Desplázate hasta el final para poder aceptar los términos')
                                  }
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>


                  {/* Action Buttons */}
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
                      disabled={loading || !acceptedTerms}
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

        {/* Preview Dialog */}
        <ContentPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          formData={formData}
          loading={loading}
          onPublish={handlePublish}
          getContentTypeLabel={getContentTypeLabel}
        />
      </main>

      <Footer />
    </div>
  );
};

export default UploadContent;
