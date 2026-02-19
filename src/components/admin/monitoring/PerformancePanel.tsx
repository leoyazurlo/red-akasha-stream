/**
 * Panel de Web Vitals / Performance Metrics para el dashboard de Analytics.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Gauge } from "lucide-react";

interface MetricSummary {
  name: string;
  p50: number;
  p75: number;
  p95: number;
  count: number;
  goodPct: number;
  unit: string;
}

const METRIC_UNITS: Record<string, string> = {
  LCP: "ms", CLS: "", INP: "ms", FCP: "ms", TTFB: "ms", FID: "ms",
};

const RATING_COLORS = {
  good: "text-green-400",
  "needs-improvement": "text-yellow-400",
  poor: "text-red-400",
};

export function PerformancePanel() {
  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["admin-performance-metrics"],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("performance_metrics")
        .select("metric_name, metric_value, rating")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Group by metric name and compute percentiles
      const grouped: Record<string, { values: number[]; ratings: string[] }> = {};
      for (const row of data) {
        if (!grouped[row.metric_name]) grouped[row.metric_name] = { values: [], ratings: [] };
        grouped[row.metric_name].values.push(row.metric_value);
        if (row.rating) grouped[row.metric_name].ratings.push(row.rating);
      }

      return Object.entries(grouped).map(([name, { values, ratings }]): MetricSummary => {
        values.sort((a, b) => a - b);
        const p = (pct: number) => values[Math.floor(values.length * pct)] ?? 0;
        const goodCount = ratings.filter((r) => r === "good").length;
        return {
          name,
          p50: p(0.5),
          p75: p(0.75),
          p95: p(0.95),
          count: values.length,
          goodPct: ratings.length > 0 ? Math.round((goodCount / ratings.length) * 100) : 0,
          unit: METRIC_UNITS[name] ?? "",
        };
      });
    },
    refetchInterval: 60_000,
  });

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4 text-cyan-400" />
          Web Vitals (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sin métricas de rendimiento aún. Se registran automáticamente en producción.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.map((m) => {
              const ratingColor = m.goodPct >= 75 ? "good" : m.goodPct >= 50 ? "needs-improvement" : "poor";
              return (
                <div
                  key={m.name}
                  className="p-3 rounded-lg border border-border/30 bg-muted/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{m.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${RATING_COLORS[ratingColor]}`}>
                      {m.goodPct}% bueno
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                    <div>
                      <span className="block text-foreground font-medium text-sm">
                        {m.unit === "ms" ? m.p50.toFixed(0) : m.p50.toFixed(3)}
                      </span>
                      P50
                    </div>
                    <div>
                      <span className="block text-foreground font-medium text-sm">
                        {m.unit === "ms" ? m.p75.toFixed(0) : m.p75.toFixed(3)}
                      </span>
                      P75
                    </div>
                    <div>
                      <span className="block text-foreground font-medium text-sm">
                        {m.unit === "ms" ? m.p95.toFixed(0) : m.p95.toFixed(3)}
                      </span>
                      P95
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{m.count} muestras</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
