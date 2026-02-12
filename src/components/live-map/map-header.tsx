import { MapPin, Radio } from "lucide-react";

interface MapHeaderProps {
  liveCount: number;
}

export function MapHeader({ liveCount }: MapHeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Mapa en Vivo
          </h1>
          <p className="text-sm text-muted-foreground">
            Artistas transmitiendo en tiempo real desde Latinoamérica
          </p>
        </div>
      </div>
      {liveCount > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
          </span>
          <span className="text-muted-foreground">
            <strong className="text-foreground">{liveCount}</strong> artista{liveCount !== 1 ? "s" : ""} en vivo ahora
          </span>
        </div>
      )}
    </div>
  );
}
