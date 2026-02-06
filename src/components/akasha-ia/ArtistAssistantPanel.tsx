import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Sparkles, 
  TrendingUp, 
  Target,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Calendar,
  Zap
} from "lucide-react";

interface PresenceAnalysis {
  profile_completeness: number;
  content_activity_score: number;
  engagement_score: number;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  priority_actions: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    impact: string;
  }>;
  content_calendar: string[];
  growth_tips: string[];
}

interface ProfileSuggestions {
  artist_name?: string;
  biography: string;
  genres: string[];
  tags: string[];
  photo_tips: string[];
  social_networks: string[];
  additional_tips: string[];
}

interface ContentOptimization {
  title_suggestions: string[];
  optimized_description: string;
  recommended_tags: string[];
  best_publish_time: string;
  thumbnail_tips: string[];
  promotion_strategy: string[];
  engagement_tips: string[];
}

const ArtistAssistantPanel = () => {
  const [activeTab, setActiveTab] = useState("presence");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfileType, setSelectedProfileType] = useState("musician");
  
  // Results
  const [presenceAnalysis, setPresenceAnalysis] = useState<PresenceAnalysis | null>(null);
  const [profileSuggestions, setProfileSuggestions] = useState<ProfileSuggestions | null>(null);
  const [contentOptimization, setContentOptimization] = useState<ContentOptimization | null>(null);

  // Content optimization inputs
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("video");
  const [contentDescription, setContentDescription] = useState("");

  const analyzePresence = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-artist-assistant", {
        body: { action: "analyze_presence" }
      });

      if (error) throw error;
      setPresenceAnalysis(data.result);
      toast.success("Análisis de presencia completado");
    } catch (error) {
      console.error("Error analyzing presence:", error);
      toast.error("Error al analizar presencia");
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-artist-assistant", {
        body: { 
          action: "assist_profile_creation",
          data: { profileType: selectedProfileType }
        }
      });

      if (error) throw error;
      setProfileSuggestions(data.result);
      toast.success("Sugerencias generadas");
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast.error("Error al generar sugerencias");
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeContent = async () => {
    if (!contentTitle.trim()) {
      toast.error("Ingresa un título para el contenido");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-artist-assistant", {
        body: { 
          action: "optimize_content",
          data: { 
            content: {
              title: contentTitle,
              description: contentDescription,
              type: contentType
            },
            contentType 
          }
        }
      });

      if (error) throw error;
      setContentOptimization(data.result);
      toast.success("Optimización completada");
    } catch (error) {
      console.error("Error optimizing content:", error);
      toast.error("Error al optimizar contenido");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "";
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Asistente de Artistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="presence" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Presencia
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Crear Perfil
            </TabsTrigger>
            <TabsTrigger value="optimize" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Optimizar
            </TabsTrigger>
          </TabsList>

          {/* Presence Analysis Tab */}
          <TabsContent value="presence" className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Analiza tu presencia actual en la plataforma y obtén recomendaciones personalizadas
              </p>
              <Button onClick={analyzePresence} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analizar Mi Presencia
                  </>
                )}
              </Button>
            </div>

            {presenceAnalysis && (
              <div className="space-y-6 mt-6">
                {/* Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-background/50 p-4 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(presenceAnalysis.overall_score)}`}>
                      {presenceAnalysis.overall_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Puntuación General</div>
                  </Card>
                  <Card className="bg-background/50 p-4 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(presenceAnalysis.profile_completeness)}`}>
                      {presenceAnalysis.profile_completeness}%
                    </div>
                    <div className="text-xs text-muted-foreground">Perfil Completo</div>
                  </Card>
                  <Card className="bg-background/50 p-4 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(presenceAnalysis.content_activity_score)}`}>
                      {presenceAnalysis.content_activity_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Actividad</div>
                  </Card>
                  <Card className="bg-background/50 p-4 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(presenceAnalysis.engagement_score)}`}>
                      {presenceAnalysis.engagement_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Engagement</div>
                  </Card>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-green-500/5 border-green-500/20 p-4">
                    <h4 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Fortalezas
                    </h4>
                    <ul className="space-y-1">
                      {presenceAnalysis.strengths?.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  </Card>
                  <Card className="bg-orange-500/5 border-orange-500/20 p-4">
                    <h4 className="font-medium text-orange-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Áreas de Mejora
                    </h4>
                    <ul className="space-y-1">
                      {presenceAnalysis.weaknesses?.map((w, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {w}</li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* Priority Actions */}
                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Acciones Prioritarias
                  </h4>
                  <div className="space-y-2">
                    {presenceAnalysis.priority_actions?.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded bg-background/50">
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{action.action}</p>
                          <p className="text-xs text-muted-foreground">{action.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Growth Tips */}
                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Tips de Crecimiento
                  </h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {presenceAnalysis.growth_tips?.map((tip, i) => (
                      <div key={i} className="text-sm text-muted-foreground p-2 bg-background/50 rounded">
                        💡 {tip}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Profile Creation Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Perfil</label>
                <Select value={selectedProfileType} onValueChange={setSelectedProfileType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="musician">Músico/Artista</SelectItem>
                    <SelectItem value="dj">DJ</SelectItem>
                    <SelectItem value="producer">Productor</SelectItem>
                    <SelectItem value="band">Banda</SelectItem>
                    <SelectItem value="promoter">Promotor</SelectItem>
                    <SelectItem value="venue">Venue/Club</SelectItem>
                    <SelectItem value="label">Sello Discográfico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={getProfileSuggestions} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar Sugerencias de Perfil
                  </>
                )}
              </Button>
            </div>

            {profileSuggestions && (
              <div className="space-y-4 mt-6">
                {profileSuggestions.artist_name && (
                  <Card className="bg-background/50 p-4">
                    <h4 className="font-medium mb-2">Nombre Sugerido</h4>
                    <p className="text-lg text-primary">{profileSuggestions.artist_name}</p>
                  </Card>
                )}

                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-2">Biografía Sugerida</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profileSuggestions.biography}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(profileSuggestions.biography);
                      toast.success("Biografía copiada");
                    }}
                  >
                    Copiar
                  </Button>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-background/50 p-4">
                    <h4 className="font-medium mb-2">Géneros</h4>
                    <div className="flex flex-wrap gap-2">
                      {profileSuggestions.genres?.map((g, i) => (
                        <Badge key={i} variant="secondary">{g}</Badge>
                      ))}
                    </div>
                  </Card>
                  <Card className="bg-background/50 p-4">
                    <h4 className="font-medium mb-2">Tags Recomendados</h4>
                    <div className="flex flex-wrap gap-2">
                      {profileSuggestions.tags?.map((t, i) => (
                        <Badge key={i} variant="outline">#{t}</Badge>
                      ))}
                    </div>
                  </Card>
                </div>

                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-2">Tips para Fotos</h4>
                  <ul className="space-y-1">
                    {profileSuggestions.photo_tips?.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground">📸 {tip}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Content Optimization Tab */}
          <TabsContent value="optimize" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Contenido</label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Clip</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="dj_set">DJ Set</SelectItem>
                    <SelectItem value="live_music">Live Music</SelectItem>
                    <SelectItem value="documentary">Documental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Título del Contenido</label>
                <Input 
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="Ingresa el título de tu contenido..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Descripción Actual (opcional)</label>
                <Textarea 
                  value={contentDescription}
                  onChange={(e) => setContentDescription(e.target.value)}
                  placeholder="Descripción actual para optimizar..."
                  rows={3}
                />
              </div>

              <Button onClick={optimizeContent} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Optimizando...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Optimizar Contenido
                  </>
                )}
              </Button>
            </div>

            {contentOptimization && (
              <div className="space-y-4 mt-6">
                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-2">Títulos Sugeridos</h4>
                  <ul className="space-y-2">
                    {contentOptimization.title_suggestions?.map((title, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-sm text-primary">{title}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(title);
                            toast.success("Título copiado");
                          }}
                        >
                          📋
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-2">Descripción Optimizada</h4>
                  <p className="text-sm text-muted-foreground">
                    {contentOptimization.optimized_description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(contentOptimization.optimized_description);
                      toast.success("Descripción copiada");
                    }}
                  >
                    Copiar
                  </Button>
                </Card>

                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-2">Tags Recomendados</h4>
                  <div className="flex flex-wrap gap-2">
                    {contentOptimization.recommended_tags?.map((tag, i) => (
                      <Badge key={i} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-background/50 p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Mejor Horario
                    </h4>
                    <p className="text-sm text-primary">{contentOptimization.best_publish_time}</p>
                  </Card>
                  <Card className="bg-background/50 p-4">
                    <h4 className="font-medium mb-2">Tips para Thumbnail</h4>
                    <ul className="space-y-1">
                      {contentOptimization.thumbnail_tips?.slice(0, 3).map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
                      ))}
                    </ul>
                  </Card>
                </div>

                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-2">Estrategia de Promoción</h4>
                  <ul className="space-y-1">
                    {contentOptimization.promotion_strategy?.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {i + 1}. {step}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ArtistAssistantPanel;
