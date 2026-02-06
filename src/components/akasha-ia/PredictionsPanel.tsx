import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from "lucide-react";

interface Prediction {
  id: string;
  prediction_type: string;
  title: string;
  description: string;
  confidence_score: number;
  time_horizon: string;
  prediction_data: any;
  created_at: string;
}

interface Collaboration {
  id: string;
  compatibility_score: number;
  collaboration_type: string;
  reasons: string[];
  profile1: { id: string; display_name: string; profile_type: string; avatar_url: string };
  profile2: { id: string; display_name: string; profile_type: string; avatar_url: string };
}

const PREDICTION_ICONS: Record<string, React.ReactNode> = {
  trend: <TrendingUp className="h-5 w-5" />,
  collaboration: <Users className="h-5 w-5" />,
  revenue: <DollarSign className="h-5 w-5" />,
  user_growth: <BarChart3 className="h-5 w-5" />,
  content_performance: <Target className="h-5 w-5" />,
};

const PREDICTION_COLORS: Record<string, string> = {
  trend: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  collaboration: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  revenue: "bg-green-500/20 text-green-400 border-green-500/30",
  user_growth: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  content_performance: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export function PredictionsPanel() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
    loadPredictions();
    loadCollaborations();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    setIsAdmin(!!data);
  };

  const loadPredictions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-predictions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "get_predictions" })
        }
      );

      const result = await response.json();
      if (result.predictions) {
        setPredictions(result.predictions);
      }
    } catch (error) {
      console.error("Error loading predictions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollaborations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-predictions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "get_my_collaborations" })
        }
      );

      const result = await response.json();
      if (result.collaborations) {
        setCollaborations(result.collaborations);
      }
    } catch (error) {
      console.error("Error loading collaborations:", error);
    }
  };

  const generatePredictions = async () => {
    if (!isAdmin) {
      toast.error("Solo administradores pueden generar predicciones");
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-predictions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "generate_predictions" })
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Error al generar predicciones");
      }

      toast.success(`Se generaron ${result.predictions?.length || 0} predicciones`);
      loadPredictions();
    } catch (error) {
      console.error("Error generating predictions:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar predicciones");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCollaborations = async () => {
    if (!isAdmin) {
      toast.error("Solo administradores pueden generar sugerencias");
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-predictions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "generate_collaborations" })
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Error al generar sugerencias");
      }

      toast.success("Sugerencias de colaboración generadas");
      loadCollaborations();
    } catch (error) {
      console.error("Error generating collaborations:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar sugerencias");
    } finally {
      setIsGenerating(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-orange-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="predictions" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="predictions" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Predicciones
          </TabsTrigger>
          <TabsTrigger value="collaborations" className="gap-2">
            <Users className="h-4 w-4" />
            Colaboraciones
          </TabsTrigger>
        </TabsList>

        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generatePredictions}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generar Predicciones
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateCollaborations}
              disabled={isGenerating}
            >
              <Zap className="h-4 w-4 mr-2" />
              Sugerir Colaboraciones
            </Button>
          </div>
        )}
      </div>

      <TabsContent value="predictions">
        {predictions.length === 0 ? (
          <Card className="bg-card/50 border-border">
            <CardContent className="py-12 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay predicciones disponibles.
                {isAdmin && " Genera nuevas predicciones con el botón de arriba."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {predictions.map((pred) => (
              <Card 
                key={pred.id} 
                className={`border ${PREDICTION_COLORS[pred.prediction_type] || "border-border"}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${PREDICTION_COLORS[pred.prediction_type]?.split(" ")[0] || "bg-muted"}`}>
                        {PREDICTION_ICONS[pred.prediction_type] || <Sparkles className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-base">{pred.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {pred.time_horizon}
                          </Badge>
                          <span className={`text-xs font-medium ${getConfidenceColor(pred.confidence_score)}`}>
                            {Math.round(pred.confidence_score * 100)}% confianza
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{pred.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="collaborations">
        {collaborations.length === 0 ? (
          <Card className="bg-card/50 border-border">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay sugerencias de colaboración para ti todavía.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {collaborations.map((collab) => (
              <Card key={collab.id} className="bg-card/50 border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    {/* Profile 1 */}
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {collab.profile1?.avatar_url ? (
                          <img src={collab.profile1.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{collab.profile1?.display_name || "Perfil"}</p>
                        <p className="text-xs text-muted-foreground">{collab.profile1?.profile_type}</p>
                      </div>
                    </div>

                    {/* Compatibility */}
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getConfidenceColor(collab.compatibility_score)}`}>
                        {Math.round(collab.compatibility_score * 100)}%
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {collab.collaboration_type}
                      </Badge>
                    </div>

                    {/* Profile 2 */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <div className="text-right">
                        <p className="font-medium text-sm">{collab.profile2?.display_name || "Perfil"}</p>
                        <p className="text-xs text-muted-foreground">{collab.profile2?.profile_type}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {collab.profile2?.avatar_url ? (
                          <img src={collab.profile2.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {collab.reasons && collab.reasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {collab.reasons.join(" • ")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
