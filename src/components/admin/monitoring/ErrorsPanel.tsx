/**
 * Panel de errores recientes para el dashboard de Analytics/Monitoreo.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ErrorLog {
  id: string;
  error_message: string;
  error_type: string;
  severity: string;
  component: string | null;
  page: string | null;
  session_id: string | null;
  resolved: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

const SEVERITY_CONFIG = {
  critical: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", badge: "destructive" as const },
  error: { icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-400/10", badge: "secondary" as const },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10", badge: "outline" as const },
};

export function ErrorsPanel() {
  const [filter, setFilter] = useState<"all" | "critical" | "error" | "warning">("all");
  const queryClient = useQueryClient();

  const { data: errors = [], isLoading } = useQuery({
    queryKey: ["admin-error-logs", filter],
    queryFn: async () => {
      let query = supabase
        .from("error_logs")
        .select("id, error_message, error_type, severity, component, page, session_id, resolved, created_at, metadata")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter !== "all") {
        query = query.eq("severity", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ErrorLog[];
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (errorId: string) => {
      const { error } = await supabase
        .from("error_logs")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", errorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-error-logs"] });
      toast.success("Error marcado como resuelto");
    },
  });

  const criticalCount = errors.filter((e) => e.severity === "critical").length;
  const errorCount = errors.filter((e) => e.severity === "error").length;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            Errores sin resolver
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">{criticalCount} críticos</Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {(["all", "critical", "error", "warning"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                className="text-[10px] h-6 px-2"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Todos" : f}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : errors.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-400" />
            Sin errores pendientes
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {errors.map((err) => {
              const config = SEVERITY_CONFIG[err.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.error;
              const Icon = config.icon;
              return (
                <div
                  key={err.id}
                  className={`p-3 rounded-lg border border-border/30 ${config.bg} flex items-start gap-3`}
                >
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{err.error_message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px]">{err.error_type}</Badge>
                      {err.page && <span className="text-[10px] text-muted-foreground">{err.page}</span>}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(err.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => resolveMutation.mutate(err.id)}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
