/**
 * @fileoverview Dashboard de analytics para artistas.
 * Muestra métricas reales del contenido, seguidores y rendimiento del creador.
 */

import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Users,
  Clock,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Eye,
  Calendar,
  Play,
  Heart,
  Share2,
  MessageSquare,
  Film,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Period = "7d" | "30d" | "90d" | "all";

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover/95 backdrop-blur-md px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString("es-AR")}
        </p>
      ))}
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  delta,
  icon: Icon,
  suffix = "",
  loading = false,
}: {
  title: string;
  value: string | number;
  delta?: number;
  icon: React.ElementType;
  suffix?: string;
  loading?: boolean;
}) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border hover:border-primary/30 transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">
                {typeof value === "number" ? value.toLocaleString("es-AR") : value}
                {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
              </p>
            )}
            {delta !== undefined && !loading && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${delta >= 0 ? "text-green-400" : "text-destructive"}`}>
                {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{delta >= 0 ? "+" : ""}{delta}% vs período anterior</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helper: get date range ──────────────────────────────────────────────────

function getDateRange(period: Period): { since: string; prev: string } {
  const now = new Date();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365 * 5;
  const since = new Date(now.getTime() - days * 86400000);
  const prev = new Date(since.getTime() - days * 86400000);
  return { since: since.toISOString(), prev: prev.toISOString() };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ArtistAnalytics() {
  const [period, setPeriod] = useState<Period>("30d");
  const { user } = useAuth();
  const userId = user?.id;

  const { since, prev } = useMemo(() => getDateRange(period), [period]);

  // ── Fetch content uploads by this user ──
  const { data: myContent, isLoading: loadingContent } = useQuery({
    queryKey: ["artist-analytics-content", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("content_uploads")
        .select("id, title, thumbnail_url, created_at, views_count, likes_count, shares_count, comments_count, video_duration_seconds, content_type")
        .eq("uploader_id", userId)
        .eq("status", "approved")
        .order("views_count", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // ── Fetch followers ──
  const { data: followersData, isLoading: loadingFollowers } = useQuery({
    queryKey: ["artist-analytics-followers", userId, period],
    queryFn: async () => {
      if (!userId) return { total: 0, recent: 0, previous: 0, timeline: [] as { label: string; followers: number }[] };
      
      // Total followers
      const { count: total } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId);

      // New followers in current period
      const { count: recent } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId)
        .gte("created_at", since);

      // New followers in previous period (for delta)
      const { count: previous } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId)
        .gte("created_at", prev)
        .lt("created_at", since);

      // Timeline: followers by day
      const { data: followEntries } = await supabase
        .from("user_follows")
        .select("created_at")
        .eq("following_id", userId)
        .order("created_at", { ascending: true });

      const dayMap: Record<string, number> = {};
      let cumulative = 0;
      (followEntries || []).forEach((f) => {
        const day = new Date(f.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
        cumulative++;
        dayMap[day] = cumulative;
      });

      const timeline = Object.entries(dayMap).map(([label, followers]) => ({ label, followers }));

      return { total: total || 0, recent: recent || 0, previous: previous || 0, timeline };
    },
    enabled: !!userId,
  });

  // ── Fetch streams ──
  const { data: streamsData, isLoading: loadingStreams } = useQuery({
    queryKey: ["artist-analytics-streams", userId, period],
    queryFn: async () => {
      if (!userId) return { total: 0, recent: 0 };
      const { count: total } = await supabase
        .from("streams")
        .select("id", { count: "exact", head: true })
        .eq("streamer_id", userId);

      const { count: recent } = await supabase
        .from("streams")
        .select("id", { count: "exact", head: true })
        .eq("streamer_id", userId)
        .gte("created_at", since);

      return { total: total || 0, recent: recent || 0 };
    },
    enabled: !!userId,
  });

  // ── Derived metrics ──
  const totalViews = myContent?.reduce((sum, c) => sum + (c.views_count || 0), 0) || 0;
  const totalLikes = myContent?.reduce((sum, c) => sum + (c.likes_count || 0), 0) || 0;
  const totalShares = myContent?.reduce((sum, c) => sum + (c.shares_count || 0), 0) || 0;
  const totalComments = myContent?.reduce((sum, c) => sum + (c.comments_count || 0), 0) || 0;
  const totalDurationHrs = Math.round((myContent?.reduce((sum, c) => sum + (c.video_duration_seconds || 0), 0) || 0) / 3600 * 10) / 10;
  const newFollowers = followersData?.recent || 0;
  const prevFollowers = followersData?.previous || 0;
  const followersDelta = prevFollowers > 0 ? Math.round(((newFollowers - prevFollowers) / prevFollowers) * 100) : newFollowers > 0 ? 100 : 0;

  // Views timeline (by content creation date)
  const viewsTimeline = useMemo(() => {
    if (!myContent?.length) return [];
    const sorted = [...myContent].sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());
    return sorted.map((c) => ({
      label: new Date(c.created_at!).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
      views: c.views_count || 0,
      title: c.title,
    }));
  }, [myContent]);

  const isLoading = loadingContent || loadingFollowers || loadingStreams;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const metricsSheet = XLSX.utils.json_to_sheet([
      { Métrica: "Total Reproducciones", Valor: totalViews },
      { Métrica: "Total Likes", Valor: totalLikes },
      { Métrica: "Total Compartidos", Valor: totalShares },
      { Métrica: "Total Comentarios", Valor: totalComments },
      { Métrica: "Horas de Contenido", Valor: totalDurationHrs },
      { Métrica: "Seguidores Totales", Valor: followersData?.total || 0 },
      { Métrica: "Nuevos Seguidores (período)", Valor: newFollowers },
    ]);
    XLSX.utils.book_append_sheet(wb, metricsSheet, "Resumen");

    if (myContent?.length) {
      const contentSheet = XLSX.utils.json_to_sheet(
        myContent.map((c) => ({
          Título: c.title,
          Tipo: c.content_type,
          Reproducciones: c.views_count,
          Likes: c.likes_count,
          Compartidos: c.shares_count,
          Comentarios: c.comments_count,
          Fecha: new Date(c.created_at!).toLocaleDateString("es-AR"),
        }))
      );
      XLSX.utils.book_append_sheet(wb, contentSheet, "Contenido");
    }

    XLSX.writeFile(wb, `akasha-analytics-${period}.xlsx`);
  };

  const periodLabels: Record<Period, string> = {
    "7d": "Últimos 7 días",
    "30d": "Últimos 30 días",
    "90d": "Últimos 90 días",
    all: "Todo el tiempo",
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-background relative">
      <CosmicBackground />
      <div className="relative z-10">
        <Header />
        <main id="main-content" className="pt-24 pb-16 px-4 max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Mis Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Datos reales de tu contenido en Red Akasha
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2" onClick={exportToExcel} disabled={isLoading}>
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Reproducciones" value={totalViews} icon={Eye} loading={isLoading} />
            <MetricCard title="Total Likes" value={totalLikes} icon={Heart} loading={isLoading} />
            <MetricCard title="Seguidores" value={followersData?.total || 0} delta={followersDelta} icon={UserPlus} loading={isLoading} />
            <MetricCard title="Contenidos Publicados" value={myContent?.length || 0} icon={Film} loading={isLoading} />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Compartidos" value={totalShares} icon={Share2} loading={isLoading} />
            <MetricCard title="Comentarios" value={totalComments} icon={MessageSquare} loading={isLoading} />
            <MetricCard title="Horas de Contenido" value={totalDurationHrs} icon={Clock} suffix="hrs" loading={isLoading} />
          </div>

          {/* Views per Content */}
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Reproducciones por contenido
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : viewsTimeline.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  Aún no tenés contenido publicado. ¡Subí tu primer video o audio!
                </p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={viewsTimeline} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 18%)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "hsl(240 5% 55%)", fontSize: 11 }}
                        axisLine={{ stroke: "hsl(240 10% 18%)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "hsl(240 5% 55%)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="views"
                        name="Reproducciones"
                        fill="hsl(270 70% 55%)"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1000}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Content */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Top Contenido
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : !myContent?.length ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sin contenido aún</p>
                ) : (
                  <div className="space-y-3">
                    {myContent.slice(0, 5).map((content, idx) => (
                      <div
                        key={content.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors group"
                      >
                        <span className="text-sm font-bold text-muted-foreground w-5 text-center">
                          {idx + 1}
                        </span>
                        <div className="w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={content.thumbnail_url || "/placeholder.svg"}
                            alt={content.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {content.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(content.created_at!).toLocaleDateString("es-AR")}
                            {content.video_duration_seconds ? ` · ${formatDuration(content.video_duration_seconds)}` : ""}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold">{(content.views_count || 0).toLocaleString("es-AR")}</p>
                          <p className="text-xs text-muted-foreground">{content.likes_count || 0} ❤️</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement breakdown */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Engagement por Contenido
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : !myContent?.length ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sin datos</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={myContent.slice(0, 5).map((c) => ({
                          name: c.title.length > 15 ? c.title.slice(0, 15) + "…" : c.title,
                          Likes: c.likes_count || 0,
                          Shares: c.shares_count || 0,
                          Comentarios: c.comments_count || 0,
                        }))}
                        margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 18%)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "hsl(240 5% 55%)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          angle={-30}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fill: "hsl(240 5% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="Likes" fill="hsl(340 82% 52%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Shares" fill="hsl(180 100% 50%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Comentarios" fill="hsl(48 96% 53%)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Followers Growth */}
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Crecimiento de Seguidores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : !followersData?.timeline.length ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  Aún no tenés seguidores. ¡Compartí tu contenido para crecer!
                </p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={followersData.timeline} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="followersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(180 100% 50%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(180 100% 50%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 18%)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "hsl(240 5% 55%)", fontSize: 11 }}
                        axisLine={{ stroke: "hsl(240 10% 18%)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "hsl(240 5% 55%)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="followers"
                        name="Seguidores"
                        stroke="hsl(180 100% 50%)"
                        strokeWidth={2}
                        fill="url(#followersGradient)"
                        animationDuration={1200}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
}
