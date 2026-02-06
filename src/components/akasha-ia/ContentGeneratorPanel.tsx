import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Sparkles, 
  Share2, 
  Lightbulb,
  Loader2,
  Copy,
  Newspaper,
  MessageSquare,
  Instagram,
  Twitter,
  Facebook,
  Youtube
} from "lucide-react";

interface BioResult {
  biography: string;
}

interface DescriptionResult {
  description: string;
  hashtags?: string[];
  call_to_action?: string;
  character_count?: number;
}

interface PromoResult {
  headline: string;
  body: string;
  short_version: string;
  hashtags: string[];
  call_to_action: string;
  urgency_phrase: string;
}

interface SocialIdea {
  concept: string;
  copy: string;
  content_type: string;
  best_time: string;
  hashtags: string[];
  engagement_tip: string;
}

interface SocialIdeasResult {
  ideas: SocialIdea[];
  content_calendar_suggestion: string;
}

interface PressReleaseResult {
  headline: string;
  subheadline: string;
  dateline: string;
  lead_paragraph: string;
  body_paragraphs: string[];
  quote: string;
  quote_attribution: string;
  boilerplate: string;
  full_text: string;
}

const ContentGeneratorPanel = () => {
  const [activeTab, setActiveTab] = useState("bio");
  const [isLoading, setIsLoading] = useState(false);

  // Bio generator state
  const [bioStyle, setBioStyle] = useState("professional");
  const [bioLength, setBioLength] = useState("medium");
  const [bioContext, setBioContext] = useState("");
  const [bioResult, setBioResult] = useState<BioResult | null>(null);

  // Description generator state
  const [descPlatform, setDescPlatform] = useState("redakasha");
  const [descTitle, setDescTitle] = useState("");
  const [descType, setDescType] = useState("video");
  const [descDetails, setDescDetails] = useState("");
  const [descResult, setDescResult] = useState<DescriptionResult | null>(null);

  // Promo generator state
  const [promoTone, setPromoTone] = useState("hype");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventArtists, setEventArtists] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);

  // Social ideas state
  const [socialPlatform, setSocialPlatform] = useState("instagram");
  const [profileInfo, setProfileInfo] = useState("");
  const [socialResult, setSocialResult] = useState<SocialIdeasResult | null>(null);

  // Press release state
  const [pressInfo, setPressInfo] = useState("");
  const [pressResult, setPressResult] = useState<PressReleaseResult | null>(null);

  const generateBio = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-content-generator", {
        body: { 
          action: "generate_bio",
          data: { 
            context: bioContext ? JSON.parse(bioContext) : {},
            style: bioStyle,
            length: bioLength
          }
        }
      });

      if (error) throw error;
      setBioResult(data.result);
      toast.success("Biografía generada");
    } catch (error) {
      console.error("Error generating bio:", error);
      toast.error("Error al generar biografía");
    } finally {
      setIsLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!descTitle.trim()) {
      toast.error("Ingresa un título");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-content-generator", {
        body: { 
          action: "generate_description",
          data: { 
            content: {
              title: descTitle,
              type: descType,
              details: descDetails
            },
            platform: descPlatform
          }
        }
      });

      if (error) throw error;
      setDescResult(data.result);
      toast.success("Descripción generada");
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Error al generar descripción");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePromo = async () => {
    if (!eventName.trim()) {
      toast.error("Ingresa el nombre del evento");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-content-generator", {
        body: { 
          action: "generate_promo",
          data: { 
            event: {
              name: eventName,
              date: eventDate,
              venue: eventVenue,
              artists: eventArtists
            },
            tone: promoTone
          }
        }
      });

      if (error) throw error;
      setPromoResult(data.result);
      toast.success("Texto promocional generado");
    } catch (error) {
      console.error("Error generating promo:", error);
      toast.error("Error al generar promoción");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSocialIdeas = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-content-generator", {
        body: { 
          action: "generate_social_ideas",
          data: { 
            profile: profileInfo ? JSON.parse(profileInfo) : {},
            platform: socialPlatform,
            count: 5
          }
        }
      });

      if (error) throw error;
      setSocialResult(data.result);
      toast.success("Ideas generadas");
    } catch (error) {
      console.error("Error generating social ideas:", error);
      toast.error("Error al generar ideas");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePressRelease = async () => {
    if (!pressInfo.trim()) {
      toast.error("Ingresa información para el comunicado");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-content-generator", {
        body: { 
          action: "generate_press_release",
          data: { 
            info: JSON.parse(pressInfo)
          }
        }
      });

      if (error) throw error;
      setPressResult(data.result);
      toast.success("Comunicado generado");
    } catch (error) {
      console.error("Error generating press release:", error);
      toast.error("Error al generar comunicado");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="h-4 w-4" />;
      case "twitter": return <Twitter className="h-4 w-4" />;
      case "facebook": return <Facebook className="h-4 w-4" />;
      case "youtube": return <Youtube className="h-4 w-4" />;
      default: return <Share2 className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Generador de Contenido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="bio" className="text-xs">Bio</TabsTrigger>
            <TabsTrigger value="description" className="text-xs">Descripción</TabsTrigger>
            <TabsTrigger value="promo" className="text-xs">Promo</TabsTrigger>
            <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
            <TabsTrigger value="press" className="text-xs">Prensa</TabsTrigger>
          </TabsList>

          {/* Bio Generator */}
          <TabsContent value="bio" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Estilo</label>
                <Select value={bioStyle} onValueChange={setBioStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profesional</SelectItem>
                    <SelectItem value="creative">Creativo</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="mysterious">Misterioso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Longitud</label>
                <Select value={bioLength} onValueChange={setBioLength}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Corta (50-100 palabras)</SelectItem>
                    <SelectItem value="medium">Media (150-250 palabras)</SelectItem>
                    <SelectItem value="long">Larga (300-500 palabras)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Contexto (JSON opcional)</label>
              <Textarea 
                value={bioContext}
                onChange={(e) => setBioContext(e.target.value)}
                placeholder='{"name": "DJ Shadow", "genres": ["Techno", "House"], "years_active": 10}'
                rows={3}
              />
            </div>

            <Button onClick={generateBio} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generar Biografía
            </Button>

            {bioResult && (
              <Card className="bg-background/50 p-4 mt-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Biografía Generada</h4>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(bioResult.biography)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bioResult.biography}</p>
              </Card>
            )}
          </TabsContent>

          {/* Description Generator */}
          <TabsContent value="description" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Plataforma</label>
                <Select value={descPlatform} onValueChange={setDescPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="redakasha">Red Akasha</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Contenido</label>
                <Select value={descType} onValueChange={setDescType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="dj_set">DJ Set</SelectItem>
                    <SelectItem value="live">Live Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input 
                value={descTitle}
                onChange={(e) => setDescTitle(e.target.value)}
                placeholder="Título del contenido..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Detalles adicionales</label>
              <Textarea 
                value={descDetails}
                onChange={(e) => setDescDetails(e.target.value)}
                placeholder="Artistas, géneros, ocasión especial..."
                rows={2}
              />
            </div>

            <Button onClick={generateDescription} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Generar Descripción
            </Button>

            {descResult && (
              <Card className="bg-background/50 p-4 mt-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Descripción</h4>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(descResult.description)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{descResult.description}</p>
                {descResult.hashtags && (
                  <div className="flex flex-wrap gap-1">
                    {descResult.hashtags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                    ))}
                  </div>
                )}
                {descResult.call_to_action && (
                  <p className="text-sm text-primary">{descResult.call_to_action}</p>
                )}
              </Card>
            )}
          </TabsContent>

          {/* Promo Generator */}
          <TabsContent value="promo" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tono</label>
              <Select value={promoTone} onValueChange={setPromoTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hype">🔥 Hype/Energético</SelectItem>
                  <SelectItem value="elegant">✨ Elegante</SelectItem>
                  <SelectItem value="underground">🎧 Underground</SelectItem>
                  <SelectItem value="mainstream">🎉 Mainstream</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nombre del Evento</label>
                <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="RAVE MASSIVE 2024" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha</label>
                <Input value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="15 de Marzo, 2024" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Venue</label>
                <Input value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} placeholder="Club XYZ" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Artistas</label>
                <Input value={eventArtists} onChange={(e) => setEventArtists(e.target.value)} placeholder="DJ A, DJ B, DJ C" />
              </div>
            </div>

            <Button onClick={generatePromo} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generar Texto Promocional
            </Button>

            {promoResult && (
              <div className="space-y-3 mt-4">
                <Card className="bg-background/50 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-primary">{promoResult.headline}</h4>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(promoResult.headline + "\n\n" + promoResult.body)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{promoResult.body}</p>
                </Card>
                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-2 text-sm">Versión Corta (Stories/Tweets)</h4>
                  <p className="text-sm text-primary">{promoResult.short_version}</p>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(promoResult.short_version)}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                </Card>
                <div className="flex flex-wrap gap-1">
                  {promoResult.hashtags?.map((tag, i) => (
                    <Badge key={i} variant="outline">#{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Social Ideas */}
          <TabsContent value="social" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Plataforma</label>
              <Select value={socialPlatform} onValueChange={setSocialPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Info del Perfil (JSON opcional)</label>
              <Textarea 
                value={profileInfo}
                onChange={(e) => setProfileInfo(e.target.value)}
                placeholder='{"name": "DJ Shadow", "genre": "Techno", "style": "Dark"}'
                rows={2}
              />
            </div>

            <Button onClick={generateSocialIdeas} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
              Generar Ideas de Contenido
            </Button>

            {socialResult && (
              <div className="space-y-3 mt-4">
                {socialResult.ideas?.map((idea, i) => (
                  <Card key={i} className="bg-background/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded">{getPlatformIcon(socialPlatform)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{idea.concept}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{idea.copy}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">{idea.content_type}</Badge>
                          <Badge variant="outline">🕐 {idea.best_time}</Badge>
                        </div>
                        <p className="text-xs text-primary mt-2">💡 {idea.engagement_tip}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(idea.copy)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Press Release */}
          <TabsContent value="press" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Información del Comunicado (JSON)</label>
              <Textarea 
                value={pressInfo}
                onChange={(e) => setPressInfo(e.target.value)}
                placeholder={`{
  "artist": "Nombre del Artista",
  "news": "Lanzamiento de nuevo álbum",
  "date": "15 de Marzo, 2024",
  "details": "Descripción del evento/novedad",
  "quotes": "Declaraciones del artista",
  "contact": "info@artista.com"
}`}
                rows={6}
              />
            </div>

            <Button onClick={generatePressRelease} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Newspaper className="mr-2 h-4 w-4" />}
              Generar Comunicado de Prensa
            </Button>

            {pressResult && (
              <Card className="bg-background/50 p-4 mt-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{pressResult.headline}</h3>
                    {pressResult.subheadline && <p className="text-sm text-muted-foreground">{pressResult.subheadline}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(pressResult.full_text)}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar Todo
                  </Button>
                </div>
                <div className="prose prose-sm dark:prose-invert">
                  <p className="text-xs text-muted-foreground italic">{pressResult.dateline}</p>
                  <p className="font-medium">{pressResult.lead_paragraph}</p>
                  {pressResult.body_paragraphs?.map((p, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{p}</p>
                  ))}
                  {pressResult.quote && (
                    <blockquote className="border-l-2 border-primary pl-3 italic">
                      "{pressResult.quote}"
                      <footer className="text-xs">— {pressResult.quote_attribution}</footer>
                    </blockquote>
                  )}
                  <hr className="my-4" />
                  <p className="text-xs text-muted-foreground">{pressResult.boilerplate}</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContentGeneratorPanel;
