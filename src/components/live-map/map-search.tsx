import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  city: string;
  avatarUrl: string | null;
}

interface MapSearchProps {
  results: SearchResult[];
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MapSearch({ results, onSelect, searchQuery, onSearchChange }: MapSearchProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="absolute top-4 left-4 z-10 w-64">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar artista en vivo..."
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9 pr-8 bg-card/90 backdrop-blur-md border-border h-9 text-sm"
          aria-label="Buscar artista en el mapa"
        />
        {searchQuery && (
          <button
            onClick={() => { onSearchChange(""); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && searchQuery && results.length > 0 && (
        <div className="mt-1 bg-card/95 backdrop-blur-xl border border-border rounded-lg overflow-hidden shadow-lg max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelect(r.id); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-primary/10 transition-colors"
            >
              <Avatar className="h-7 w-7 border border-primary/30">
                <AvatarImage src={r.avatarUrl || ""} />
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                  {r.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{r.city}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && searchQuery && results.length === 0 && (
        <div className="mt-1 bg-card/95 backdrop-blur-xl border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Sin resultados</p>
        </div>
      )}
    </div>
  );
}
