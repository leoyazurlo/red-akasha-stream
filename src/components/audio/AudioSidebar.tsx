import { useState } from "react";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart, ListMusic, Search, Plus, Library, Music, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onPlaylistSelect: (playlistId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AudioSidebar = ({
  activeView,
  onViewChange,
  onPlaylistSelect,
  collapsed = false,
  onToggleCollapse,
}: AudioSidebarProps) => {
  const { user } = useAuth();
  const { playlists, createPlaylist } = usePlaylists();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "playlists">("all");

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePlaylist = async () => {
    const name = `Mi Playlist #${playlists.length + 1}`;
    await createPlaylist(name);
  };

  if (collapsed) {
    return (
      <div className="w-16 flex-shrink-0 bg-card/50 border-r border-border flex flex-col items-center py-4 gap-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleCollapse}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={activeView === "all" ? "default" : "ghost"}
          onClick={() => onViewChange("all")}
          className="h-10 w-10"
          title="Todo el audio"
        >
          <Music className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant={activeView === "favorites" ? "default" : "ghost"}
          onClick={() => onViewChange("favorites")}
          className="h-10 w-10"
          title="Canciones que te gustan"
        >
          <Heart className="h-5 w-5" />
        </Button>
        <div className="w-8 h-px bg-border my-1" />
        {filteredPlaylists.slice(0, 5).map((p) => (
          <Button
            key={p.id}
            size="icon"
            variant="ghost"
            onClick={() => onPlaylistSelect(p.id)}
            className="h-10 w-10 rounded-md overflow-hidden"
            title={p.name}
          >
            {p.thumbnail_url ? (
              <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <ListMusic className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 bg-card/50 border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Library className="h-5 w-5" />
          <span className="font-semibold text-foreground">Tu biblioteca</span>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCreatePlaylist}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Crear playlist"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleCollapse}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-4 pb-3 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Todo
        </button>
        <button
          onClick={() => setFilter("playlists")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            filter === "playlists"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Playlists
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="h-8 pl-8 text-xs bg-secondary/50 border-none"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-2 space-y-0.5">
          {/* Favorites */}
          <button
            onClick={() => onViewChange("favorites")}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
              activeView === "favorites"
                ? "bg-secondary"
                : "hover:bg-secondary/50"
            )}
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Canciones que te gustan
              </p>
              <p className="text-xs text-muted-foreground">Playlist • Audio</p>
            </div>
          </button>

          {/* All audio */}
          <button
            onClick={() => onViewChange("all")}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
              activeView === "all"
                ? "bg-secondary"
                : "hover:bg-secondary/50"
            )}
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Todo el Audio
              </p>
              <p className="text-xs text-muted-foreground">Biblioteca</p>
            </div>
          </button>

          {/* User playlists */}
          {filteredPlaylists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onPlaylistSelect(playlist.id)}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                activeView === `playlist-${playlist.id}`
                  ? "bg-secondary"
                  : "hover:bg-secondary/50"
              )}
            >
              <div className="w-12 h-12 rounded-md bg-muted/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {playlist.thumbnail_url ? (
                  <img
                    src={playlist.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ListMusic className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {playlist.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lista • {playlist.items_count || 0} items
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
