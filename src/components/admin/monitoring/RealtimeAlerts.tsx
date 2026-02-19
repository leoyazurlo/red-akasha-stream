/**
 * Alertas en tiempo real para errores críticos.
 * Usa Supabase Realtime para detectar nuevos errores al instante.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Bell, XCircle } from "lucide-react";
import { toast } from "sonner";

interface RealtimeError {
  id: string;
  error_message: string;
  severity: string;
  page: string | null;
  created_at: string;
}

export function RealtimeAlerts() {
  const [alerts, setAlerts] = useState<RealtimeError[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("error-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "error_logs",
          filter: "severity=eq.critical",
        },
        (payload) => {
          const newError = payload.new as RealtimeError;
          setAlerts((prev) => [newError, ...prev].slice(0, 20));

          toast.error("🚨 Error crítico detectado", {
            description: newError.error_message.slice(0, 100),
            duration: 10000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-yellow-400" />
          Alertas en Tiempo Real
          {alerts.length > 0 && (
            <Badge variant="destructive" className="text-[10px] animate-pulse">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
            Escuchando errores críticos en tiempo real…
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex items-start gap-2 animate-in slide-in-from-top-2"
              >
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{alert.error_message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {alert.page && <span className="text-[10px] text-muted-foreground">{alert.page}</span>}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(alert.created_at).toLocaleTimeString("es", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
