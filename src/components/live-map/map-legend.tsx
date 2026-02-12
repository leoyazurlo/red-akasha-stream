import { cn } from "@/lib/utils";
import { Music2, Mic2, Radio, Camera, Film, Disc3, Headphones, Users, Sparkles } from "lucide-react";

export const ARTIST_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  banda_musical: { label: "Banda", color: "hsl(270 70% 55%)", icon: Users },
  musico_solista: { label: "Solista", color: "hsl(340 80% 55%)", icon: Music2 },
  podcast: { label: "Podcast", color: "hsl(200 80% 50%)", icon: Mic2 },
  documental: { label: "Documental", color: "hsl(40 80% 50%)", icon: Film },
  cortometraje: { label: "Corto", color: "hsl(160 70% 45%)", icon: Film },
  fotografia: { label: "Fotografía", color: "hsl(20 80% 55%)", icon: Camera },
  radio_show: { label: "Radio", color: "hsl(0 70% 55%)", icon: Radio },
  musico: { label: "Músico", color: "hsl(290 70% 55%)", icon: Music2 },
  percusion: { label: "Percusión", color: "hsl(30 80% 50%)", icon: Disc3 },
  agrupacion: { label: "Agrupación", color: "hsl(180 70% 45%)", icon: Users },
  dj: { label: "DJ", color: "hsl(180 100% 50%)", icon: Headphones },
  vj: { label: "VJ", color: "hsl(300 80% 55%)", icon: Sparkles },
  danza: { label: "Danza", color: "hsl(330 70% 55%)", icon: Sparkles },
  fotografia_digital: { label: "Arte Digital", color: "hsl(50 80% 50%)", icon: Camera },
};

interface MapLegendProps {
  activeFilters: Set<string>;
  onToggleFilter: (type: string) => void;
  streamCounts: Record<string, number>;
}

export function MapLegend({ activeFilters, onToggleFilter, streamCounts }: MapLegendProps) {
  const typesWithStreams = Object.entries(ARTIST_TYPE_CONFIG).filter(
    ([key]) => (streamCounts[key] || 0) > 0
  );

  if (typesWithStreams.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-md border border-border rounded-lg p-3 max-w-[280px]">
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
        Filtrar por tipo
      </p>
      <div className="flex flex-wrap gap-1.5">
        {typesWithStreams.map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeFilters.size === 0 || activeFilters.has(key);
          const count = streamCounts[key] || 0;

          return (
            <button
              key={key}
              onClick={() => onToggleFilter(key)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border",
                isActive
                  ? "bg-primary/20 text-foreground border-primary/40"
                  : "bg-muted/30 text-muted-foreground border-transparent opacity-50 hover:opacity-75"
              )}
              aria-label={`Filtrar ${config.label}`}
              aria-pressed={isActive}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <Icon className="w-3 h-3" />
              <span>{config.label}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
