/**
 * @fileoverview Dashboard de analytics para administradores.
 * Muestra eventos recientes, features más usadas y usuarios activos.
 */

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Users,
  Zap,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface EventRow {
  event_name: string;
  created_at: string;
  user_id: string | null;
  session_id: string;
  page: string;
  properties: Record<string, unknown>;
}

const COLORS = [
  "hsl(270 70% 55%)",
  "hsl(180 100% 50%)",
  "hsl(48 96% 53%)",
  "hsl(142 71% 45%)",
  "hsl(199 89% 48%)",
  "hsl(0 84% 60%)",
];

export default function Analytics() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("analytics_events")
      .select("event_name, created_at, user_id, session_id, page, properties")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!error && data) {
      setEvents(data as EventRow[]);
    }
  };

  useEffect(() => {
    fetchEvents().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  // ── Derived stats ──

  const uniqueUsers = new Set(events.filter((e) => e.user_id).map((e) => e.user_id)).size;
  const uniqueSessions = new Set(events.map((e) => e.session_id)).size;

  // Top features (exclude page_view)
  const featureCounts: Record<string, number> = {};
  events
    .filter((e) => e.event_name !== "page_view")
    .forEach((e) => {
      featureCounts[e.event_name] = (featureCounts[e.event_name] || 0) + 1;
    });
  const topFeatures = Object.entries(featureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name: formatEventName(name), count }));

  // Hourly distribution
  const hourlyMap: Record<number, number> = {};
  events.forEach((e) => {
    const hour = new Date(e.created_at).getHours();
    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
  });
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, "0")}:00`,
    events: hourlyMap[h] || 0,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Analytics de Producto</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Últimas 24 horas · Comportamiento de uso
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard
            icon={<Activity className="h-5 w-5 text-primary" />}
            label="Eventos totales"
            value={loading ? null : events.length}
          />
          <KPICard
            icon={<Users className="h-5 w-5 text-cyan-400" />}
            label="Usuarios activos"
            value={loading ? null : uniqueUsers}
          />
          <KPICard
            icon={<Zap className="h-5 w-5 text-yellow-400" />}
            label="Sesiones"
            value={loading ? null : uniqueSessions}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Features */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Features</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : topFeatures.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Sin datos de features aún
                </p>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topFeatures}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={4}
                        label={({ name, count }) => `${name} (${count})`}
                        labelLine={false}
                      >
                        {topFeatures.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Distribution */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actividad por hora</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[240px] w-full" />
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        interval={3}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                        }}
                      />
                      <Bar
                        dataKey="events"
                        fill="hsl(270 70% 55%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Events Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Eventos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin eventos en las últimas 24 horas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">Evento</th>
                      <th className="text-left py-2 pr-4 font-medium">Página</th>
                      <th className="text-left py-2 pr-4 font-medium">Hora</th>
                      <th className="text-left py-2 font-medium">Sesión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.slice(0, 30).map((e, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-1.5 pr-4">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            {e.event_name}
                          </Badge>
                        </td>
                        <td className="py-1.5 pr-4 text-muted-foreground">
                          {e.page}
                        </td>
                        <td className="py-1.5 pr-4 text-muted-foreground">
                          {new Date(e.created_at).toLocaleTimeString("es", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-1.5 text-muted-foreground font-mono">
                          {e.session_id.slice(0, 8)}…
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// ── Sub-components ──

function KPICard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="pt-5 pb-4 flex items-center gap-4">
        <div className="p-2 rounded-lg bg-muted/30">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {value === null ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatEventName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
