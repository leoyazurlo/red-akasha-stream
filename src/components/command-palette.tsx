import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Music,
  Radio,
  Video,
  Compass,
  User,
  Upload,
  MessageSquare,
  Settings,
  Home,
  Search,
  Star,
  Tv,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

const RECENT_KEY = "akasha_recent_searches";
const MAX_RECENT = 5;

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [artists, setArtists] = useState<SearchResult[]>([]);
  const [content, setContent] = useState<SearchResult[]>([]);
  const [streams, setStreams] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, [open]);

  const saveRecent = useCallback((term: string) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((r) => r !== term)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const go = useCallback(
    (path: string, searchTerm?: string) => {
      if (searchTerm) saveRecent(searchTerm);
      onOpenChange(false);
      setQuery("");
      navigate(path);
    },
    [navigate, onOpenChange, saveRecent]
  );

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setArtists([]);
      setContent([]);
      setStreams([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);

      const [artistsRes, contentRes, streamsRes] = await Promise.all([
        supabase
          .from("artists")
          .select("id, name, artist_type, city")
          .ilike("name", `%${query}%`)
          .limit(5),
        supabase
          .from("content_uploads")
          .select("id, title, content_type")
          .ilike("title", `%${query}%`)
          .eq("status", "published")
          .limit(5),
        supabase
          .from("streams")
          .select("id, title, status")
          .ilike("title", `%${query}%`)
          .limit(5),
      ]);

      if (artistsRes.data) {
        setArtists(
          artistsRes.data.map((a) => ({
            id: a.id,
            label: a.name,
            subtitle: `${a.artist_type}${a.city ? ` · ${a.city}` : ""}`,
            icon: <User className="h-4 w-4 text-accent" />,
            action: () => go(`/artistas/${a.id}`, query),
          }))
        );
      }

      if (contentRes.data) {
        setContent(
          contentRes.data.map((c) => ({
            id: c.id,
            label: c.title,
            subtitle: c.content_type,
            icon: c.content_type === "video_clip" || c.content_type === "video_musical_vivo" ? (
              <Video className="h-4 w-4 text-accent" />
            ) : c.content_type === "podcast" ? (
              <Music className="h-4 w-4 text-accent" />
            ) : (
              <Tv className="h-4 w-4 text-accent" />
            ),
            action: () => go(`/video/${c.id}`, query),
          }))
        );
      }

      if (streamsRes.data) {
        setStreams(
          streamsRes.data.map((s) => ({
            id: s.id,
            label: s.title,
            subtitle: s.status === "live" ? "🔴 En vivo" : s.status,
            icon: <Radio className="h-4 w-4 text-destructive" />,
            action: () => go(`/on-demand`, query),
          }))
        );
      }

      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, go]);

  const navItems: SearchResult[] = [
    { id: "nav-home", label: "Inicio", icon: <Home className="h-4 w-4" />, action: () => go("/") },
    { id: "nav-ondemand", label: "On Demand", icon: <Tv className="h-4 w-4" />, action: () => go("/on-demand") },
    { id: "nav-artists", label: "Artistas", icon: <Star className="h-4 w-4" />, action: () => go("/artistas") },
    { id: "nav-circuit", label: "Circuito", icon: <Compass className="h-4 w-4" />, action: () => go("/circuito") },
    { id: "nav-upload", label: "Subir contenido", icon: <Upload className="h-4 w-4" />, action: () => go("/subir-contenido") },
    { id: "nav-forum", label: "Foro", icon: <MessageSquare className="h-4 w-4" />, action: () => go("/foro") },
    { id: "nav-profile", label: "Mi Perfil", icon: <User className="h-4 w-4" />, action: () => go("/mi-perfil") },
    { id: "nav-settings", label: "Akasha IA", icon: <Settings className="h-4 w-4" />, action: () => go("/akasha-ia") },
  ];

  const hasResults = artists.length > 0 || content.length > 0 || streams.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="bg-popover/95 backdrop-blur-xl border border-border rounded-lg">
        <CommandInput
          placeholder="Buscar artistas, contenido, streams..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            {isSearching ? "Buscando..." : "No se encontraron resultados."}
          </CommandEmpty>

          {/* Recent searches when empty */}
          {!query && recentSearches.length > 0 && (
            <CommandGroup heading="Búsquedas recientes">
              {recentSearches.map((term) => (
                <CommandItem
                  key={term}
                  onSelect={() => setQuery(term)}
                  className="cursor-pointer"
                >
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{term}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Search results */}
          {artists.length > 0 && (
            <CommandGroup heading="Artistas">
              {artists.map((r) => (
                <CommandItem key={r.id} onSelect={r.action} className="cursor-pointer">
                  {r.icon}
                  <span className="ml-2">{r.label}</span>
                  {r.subtitle && (
                    <span className="ml-auto text-xs text-muted-foreground">{r.subtitle}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {streams.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Streams">
                {streams.map((r) => (
                  <CommandItem key={r.id} onSelect={r.action} className="cursor-pointer">
                    {r.icon}
                    <span className="ml-2">{r.label}</span>
                    {r.subtitle && (
                      <span className="ml-auto text-xs text-muted-foreground">{r.subtitle}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {content.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Contenido">
                {content.map((r) => (
                  <CommandItem key={r.id} onSelect={r.action} className="cursor-pointer">
                    {r.icon}
                    <span className="ml-2">{r.label}</span>
                    {r.subtitle && (
                      <span className="ml-auto text-xs text-muted-foreground">{r.subtitle}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Navigation shortcuts always visible */}
          <CommandSeparator />
          <CommandGroup heading="Navegación rápida">
            {navItems.map((item) => (
              <CommandItem key={item.id} onSelect={item.action} className="cursor-pointer">
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
