import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  BarChart3,
  Flag,
  Eye,
  MessageSquare
} from "lucide-react";

interface ContentAnalysis {
  spam_score: number;
  toxicity_score: number;
  appropriateness_score: number;
  quality_score: number;
  is_spam: boolean;
  is_toxic: boolean;
  is_appropriate: boolean;
  flags: string[];
  recommended_action: "approve" | "review" | "warn" | "remove" | "ban_user";
  explanation: string;
  suggested_improvements: string[];
}

interface ForumHealth {
  health_score: number;
  activity_trend: "growing" | "stable" | "declining";
  trending_topics: string[];
  problem_areas: string[];
  moderation_recommendations: string[];
  engagement_suggestions: string[];
  content_gaps: string[];
  spam_risk_level: "low" | "medium" | "high";
  pending_reports: number;
}

interface Report {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  thread?: { id: string; title: string; content: string };
  post?: { id: string; content: string };
  reporter?: { username: string; full_name: string };
}

const ModeratorPanel = () => {
  const [activeTab, setActiveTab] = useState("analyze");
  const [isLoading, setIsLoading] = useState(false);
  const [contentToAnalyze, setContentToAnalyze] = useState("");
  
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [forumHealth, setForumHealth] = useState<ForumHealth | null>(null);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);

  const analyzeContent = async () => {
    if (!contentToAnalyze.trim()) {
      toast.error("Ingresa contenido para analizar");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-moderator", {
        body: { 
          action: "analyze_content",
          data: { content: contentToAnalyze, contentType: "post" }
        }
      });

      if (error) throw error;
      setContentAnalysis(data.result);
      toast.success("Análisis completado");
    } catch (error) {
      console.error("Error analyzing content:", error);
      toast.error("Error al analizar contenido");
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeForumHealth = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-moderator", {
        body: { action: "analyze_forum_health" }
      });

      if (error) throw error;
      setForumHealth(data.result);
      toast.success("Análisis del foro completado");
    } catch (error: any) {
      console.error("Error analyzing forum:", error);
      if (error.message?.includes("Solo administradores")) {
        toast.error("Solo administradores pueden acceder a esta función");
      } else {
        toast.error("Error al analizar el foro");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingReports = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-moderator", {
        body: { action: "get_pending_reports" }
      });

      if (error) throw error;
      setPendingReports(data.result.reports || []);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      if (error.message?.includes("Solo administradores")) {
        toast.error("Solo administradores pueden ver reportes");
      } else {
        toast.error("Error al cargar reportes");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number, invert = false) => {
    const effectiveScore = invert ? 100 - score : score;
    if (effectiveScore >= 80) return "text-green-500";
    if (effectiveScore >= 60) return "text-yellow-500";
    if (effectiveScore >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "approve": return "bg-green-500/20 text-green-400";
      case "review": return "bg-yellow-500/20 text-yellow-400";
      case "warn": return "bg-orange-500/20 text-orange-400";
      case "remove": return "bg-red-500/20 text-red-400";
      case "ban_user": return "bg-red-700/20 text-red-500";
      default: return "";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "growing": return "📈";
      case "stable": return "➡️";
      case "declining": return "📉";
      default: return "";
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Moderador Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Analizar
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Salud del Foro
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Reportes
            </TabsTrigger>
          </TabsList>

          {/* Content Analysis Tab */}
          <TabsContent value="analyze" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Contenido a Analizar</label>
                <Textarea 
                  value={contentToAnalyze}
                  onChange={(e) => setContentToAnalyze(e.target.value)}
                  placeholder="Pega aquí el contenido que quieres analizar para spam, toxicidad, etc..."
                  rows={4}
                />
              </div>

              <Button onClick={analyzeContent} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Analizar Contenido
                  </>
                )}
              </Button>
            </div>

            {contentAnalysis && (
              <div className="space-y-4 mt-6">
                {/* Score Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-background/50 p-4 text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(contentAnalysis.spam_score, true)}`}>
                      {contentAnalysis.spam_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Spam</div>
                    <Progress value={contentAnalysis.spam_score} className="mt-2 h-1" />
                  </Card>
                  <Card className="bg-background/50 p-4 text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(contentAnalysis.toxicity_score, true)}`}>
                      {contentAnalysis.toxicity_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Toxicidad</div>
                    <Progress value={contentAnalysis.toxicity_score} className="mt-2 h-1" />
                  </Card>
                  <Card className="bg-background/50 p-4 text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(contentAnalysis.appropriateness_score)}`}>
                      {contentAnalysis.appropriateness_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Apropiado</div>
                    <Progress value={contentAnalysis.appropriateness_score} className="mt-2 h-1" />
                  </Card>
                  <Card className="bg-background/50 p-4 text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(contentAnalysis.quality_score)}`}>
                      {contentAnalysis.quality_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Calidad</div>
                    <Progress value={contentAnalysis.quality_score} className="mt-2 h-1" />
                  </Card>
                </div>

                {/* Quick Status */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={contentAnalysis.is_spam ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                    {contentAnalysis.is_spam ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                    {contentAnalysis.is_spam ? "Es Spam" : "No Spam"}
                  </Badge>
                  <Badge className={contentAnalysis.is_toxic ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                    {contentAnalysis.is_toxic ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                    {contentAnalysis.is_toxic ? "Tóxico" : "No Tóxico"}
                  </Badge>
                  <Badge className={contentAnalysis.is_appropriate ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {contentAnalysis.is_appropriate ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {contentAnalysis.is_appropriate ? "Apropiado" : "Inapropiado"}
                  </Badge>
                </div>

                {/* Recommended Action */}
                <Card className="bg-background/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Acción Recomendada</h4>
                    <Badge className={getActionColor(contentAnalysis.recommended_action)}>
                      {contentAnalysis.recommended_action.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{contentAnalysis.explanation}</p>
                </Card>

                {/* Flags */}
                {contentAnalysis.flags && contentAnalysis.flags.length > 0 && (
                  <Card className="bg-orange-500/5 border-orange-500/20 p-4">
                    <h4 className="font-medium text-orange-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Banderas Detectadas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {contentAnalysis.flags.map((flag, i) => (
                        <Badge key={i} variant="outline" className="border-orange-500/30">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Improvements */}
                {contentAnalysis.suggested_improvements && contentAnalysis.suggested_improvements.length > 0 && (
                  <Card className="bg-background/50 p-4">
                    <h4 className="font-medium mb-2">Sugerencias de Mejora</h4>
                    <ul className="space-y-1">
                      {contentAnalysis.suggested_improvements.map((imp, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {imp}</li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Forum Health Tab */}
          <TabsContent value="health" className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Análisis completo de la salud y actividad del foro
              </p>
              <Button onClick={analyzeForumHealth} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analizar Salud del Foro
                  </>
                )}
              </Button>
            </div>

            {forumHealth && (
              <div className="space-y-4 mt-6">
                {/* Health Overview */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-background/50 p-4 text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(forumHealth.health_score)}`}>
                      {forumHealth.health_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Salud General</div>
                  </Card>
                  <Card className="bg-background/50 p-4 text-center">
                    <div className="text-3xl">{getTrendIcon(forumHealth.activity_trend)}</div>
                    <div className="text-sm font-medium capitalize">{forumHealth.activity_trend}</div>
                    <div className="text-xs text-muted-foreground">Tendencia</div>
                  </Card>
                  <Card className="bg-background/50 p-4 text-center">
                    <div className="text-3xl font-bold text-orange-400">
                      {forumHealth.pending_reports}
                    </div>
                    <div className="text-xs text-muted-foreground">Reportes Pendientes</div>
                  </Card>
                </div>

                {/* Trending Topics */}
                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-2">🔥 Temas Trending</h4>
                  <div className="flex flex-wrap gap-2">
                    {forumHealth.trending_topics?.map((topic, i) => (
                      <Badge key={i} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </Card>

                {/* Problem Areas & Recommendations */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-red-500/5 border-red-500/20 p-4">
                    <h4 className="font-medium text-red-400 mb-2">⚠️ Áreas Problemáticas</h4>
                    <ul className="space-y-1">
                      {forumHealth.problem_areas?.map((area, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {area}</li>
                      ))}
                    </ul>
                  </Card>
                  <Card className="bg-green-500/5 border-green-500/20 p-4">
                    <h4 className="font-medium text-green-400 mb-2">✅ Recomendaciones</h4>
                    <ul className="space-y-1">
                      {forumHealth.moderation_recommendations?.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {rec}</li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* Engagement Suggestions */}
                <Card className="bg-background/50 p-4">
                  <h4 className="font-medium mb-2">💡 Sugerencias de Engagement</h4>
                  <ul className="space-y-1">
                    {forumHealth.engagement_suggestions?.map((sug, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{i + 1}. {sug}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="text-center">
              <Button onClick={fetchPendingReports} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    Cargar Reportes Pendientes
                  </>
                )}
              </Button>
            </div>

            {pendingReports.length > 0 ? (
              <div className="space-y-3 mt-4">
                {pendingReports.map((report) => (
                  <Card key={report.id} className="bg-background/50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Reporte</Badge>
                          <span className="text-xs text-muted-foreground">
                            por {report.reporter?.username || "Anónimo"}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">{report.reason}</p>
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          {report.thread?.title || report.post?.content?.slice(0, 100) || "Contenido no disponible"}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        const content = report.thread?.content || report.post?.content || "";
                        setContentToAnalyze(content);
                        setActiveTab("analyze");
                        toast.info("Contenido cargado para análisis");
                      }}>
                        Analizar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay reportes pendientes</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ModeratorPanel;
