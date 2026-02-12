import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ReferenceDot,
} from "recharts";
import {
  Download,
  Users,
  Clock,
  UserPlus,
  Radio,
  TrendingUp,
  TrendingDown,
  Eye,
  Calendar,
  Play,
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Mock Data Generators ────────────────────────────────────────────────────

type Period = "24h" | "7d" | "30d" | "all";

function generateViewersData(period: Period) {
  const points =
    period === "24h" ? 24 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const labelFn = (i: number) => {
    if (period === "24h") return `${String(i).padStart(2, "0")}:00`;
    const d = new Date();
    d.setDate(d.getDate() - (points - 1 - i));
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  };
  return Array.from({ length: points }, (_, i) => ({
    label: labelFn(i),
    viewers: Math.floor(Math.random() * 800 + 100 + Math.sin(i / 3) * 200),
  }));
}

function generateFollowersData(period: Period) {
  const points =
    period === "24h" ? 24 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
  let acc = 1200;
  const streamDays = new Set(
    Array.from({ length: 5 }, () => Math.floor(Math.random() * points))
  );
  const labelFn = (i: number) => {
    if (period === "24h") return `${String(i).padStart(2, "0")}:00`;
    const d = new Date();
    d.setDate(d.getDate() - (points - 1 - i));
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  };
  return Array.from({ length: points }, (_, i) => {
    const bump = streamDays.has(i) ? Math.floor(Math.random() * 30 + 15) : Math.floor(Math.random() * 5);
    acc += bump;
    return {
      label: labelFn(i),
      followers: acc,
      isStream: streamDays.has(i),
    };
  });
}

const MOCK_TOP_STREAMS = [
  {
    id: "1",
    title: "Deep House Night Session",
    thumbnail: "/placeholder.svg",
    date: "2026-02-08",
    viewers: 1243,
    duration: "3h 15m",
    reactions: 342,
  },
  {
    id: "2",
    title: "Techno Underground Live",
    thumbnail: "/placeholder.svg",
    date: "2026-02-05",
    viewers: 987,
    duration: "2h 45m",
    reactions: 278,
  },
  {
    id: "3",
    title: "Ambient Chill Sunday",
    thumbnail: "/placeholder.svg",
    date: "2026-02-02",
    viewers: 756,
    duration: "4h 00m",
    reactions: 201,
  },
  {
    id: "4",
    title: "Vinyl Only Set — Classic House",
    thumbnail: "/placeholder.svg",
    date: "2026-01-28",
    viewers: 654,
    duration: "2h 30m",
    reactions: 189,
  },
  {
    id: "5",
    title: "B2B con DJ Akasha",
    thumbnail: "/placeholder.svg",
    date: "2026-01-20",
    viewers: 543,
    duration: "3h 00m",
    reactions: 156,
  },
];

const MOCK_GEO = [
  { city: "Buenos Aires", viewers: 2340 },
  { city: "Ciudad de México", viewers: 1890 },
  { city: "Santiago", viewers: 1250 },
  { city: "Bogotá", viewers: 980 },
  { city: "Lima", viewers: 760 },
];

const METRICS: Record<Period, { viewers: number; hours: number; newFollowers: number; streams: number; viewersDelta: number; followersDelta: number }> = {
  "24h": { viewers: 423, hours: 4.5, newFollowers: 28, streams: 1, viewersDelta: 12, followersDelta: 8 },
  "7d": { viewers: 3240, hours: 18, newFollowers: 145, streams: 5, viewersDelta: 7, followersDelta: 15 },
  "30d": { viewers: 12850, hours: 62, newFollowers: 580, streams: 18, viewersDelta: -3, followersDelta: 22 },
  "all": { viewers: 89400, hours: 340, newFollowers: 4200, streams: 124, viewersDelta: 45, followersDelta: 120 },
};

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
}: {
  title: string;
  value: string | number;
  delta?: number;
  icon: React.ElementType;
  suffix?: string;
}) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border hover:border-primary/30 transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {typeof value === "number" ? value.toLocaleString("es-AR") : value}
              {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
            </p>
            {delta !== undefined && (
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ArtistAnalytics() {
  const [period, setPeriod] = useState<Period>("7d");

  const viewersData = useMemo(() => generateViewersData(period), [period]);
  const followersData = useMemo(() => generateFollowersData(period), [period]);
  const metrics = METRICS[period];

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const metricsSheet = XLSX.utils.json_to_sheet([
      { Métrica: "Total Viewers", Valor: metrics.viewers },
      { Métrica: "Horas Streameadas", Valor: metrics.hours },
      { Métrica: "Nuevos Seguidores", Valor: metrics.newFollowers },
      { Métrica: "Streams Realizados", Valor: metrics.streams },
    ]);
    XLSX.utils.book_append_sheet(wb, metricsSheet, "Resumen");

    const viewersSheet = XLSX.utils.json_to_sheet(viewersData);
    XLSX.utils.book_append_sheet(wb, viewersSheet, "Viewers");

    const topSheet = XLSX.utils.json_to_sheet(
      MOCK_TOP_STREAMS.map(({ id, ...rest }) => rest)
    );
    XLSX.utils.book_append_sheet(wb, topSheet, "Top Streams");

    const geoSheet = XLSX.utils.json_to_sheet(MOCK_GEO);
    XLSX.utils.book_append_sheet(wb, geoSheet, "Geografía");

    const followersSheet = XLSX.utils.json_to_sheet(followersData);
    XLSX.utils.book_append_sheet(wb, followersSheet, "Seguidores");

    XLSX.writeFile(wb, `akasha-analytics-${period}.xlsx`);
  };

  const periodLabels: Record<Period, string> = {
    "24h": "Últimas 24 horas",
    "7d": "Últimos 7 días",
    "30d": "Últimos 30 días",
    all: "Todo el tiempo",
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
                Última actualización: {new Date().toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2" onClick={exportToExcel}>
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Viewers" value={metrics.viewers} delta={metrics.viewersDelta} icon={Eye} />
            <MetricCard title="Horas Streameadas" value={metrics.hours} icon={Clock} suffix="hrs" />
            <MetricCard title="Nuevos Seguidores" value={metrics.newFollowers} delta={metrics.followersDelta} icon={UserPlus} />
            <MetricCard title="Streams Realizados" value={metrics.streams} icon={Radio} />
          </div>

          {/* Viewers Over Time */}
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Viewers en el tiempo — {periodLabels[period]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewersData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(270 70% 55%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(270 70% 55%)" stopOpacity={0} />
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
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="viewers"
                      name="Viewers"
                      stroke="hsl(270 70% 55%)"
                      strokeWidth={2}
                      fill="url(#viewersGradient)"
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Streams */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Top Streams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_TOP_STREAMS.map((stream, idx) => (
                    <div
                      key={stream.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors cursor-pointer group"
                    >
                      <span className="text-sm font-bold text-muted-foreground w-5 text-center">
                        {idx + 1}
                      </span>
                      <div className="w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={stream.thumbnail}
                          alt={stream.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {stream.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(stream.date).toLocaleDateString("es-AR")} · {stream.duration}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold">{stream.viewers.toLocaleString("es-AR")}</p>
                        <p className="text-xs text-muted-foreground">{stream.reactions} ❤️</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Distribución Geográfica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={MOCK_GEO}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 18%)" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: "hsl(240 5% 55%)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="city"
                        type="category"
                        tick={{ fill: "hsl(240 5% 55%)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={120}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="viewers"
                        name="Viewers"
                        fill="hsl(270 70% 55%)"
                        radius={[0, 6, 6, 0]}
                        animationDuration={1000}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={followersData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="followers"
                      name="Seguidores"
                      stroke="hsl(180 100% 50%)"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={1500}
                    />
                    {followersData
                      .filter((d) => d.isStream)
                      .map((d, i) => (
                        <ReferenceDot
                          key={i}
                          x={d.label}
                          y={d.followers}
                          r={5}
                          fill="hsl(270 70% 55%)"
                          stroke="hsl(270 70% 55%)"
                          strokeWidth={2}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[hsl(180,100%,50%)]" /> Seguidores
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary" /> Stream realizado
                </span>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
}
