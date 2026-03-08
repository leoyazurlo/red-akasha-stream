import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { AudioSidebar } from "@/components/audio/AudioSidebar";
import { AudioTrackList } from "@/components/audio/AudioTrackList";
import { AudioBottomPlayer } from "@/components/audio/AudioBottomPlayer";
import { useFavorites } from "@/hooks/useFavorites";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Heart, Music } from "lucide-react";

interface AudioContent {
  id: string;
  title: string;
  band_name: string | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  content_type: string;
  duration: number | null;
  views_count: number | null;
  audio_duration_seconds: number | null;
}

const OnDemandAudio = () => {
  const [allAudio, setAllAudio] = useState<AudioContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("all");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<AudioContent[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { favorites } = useFavorites();
  const { playlists, getPlaylistItems } = usePlaylists();

  // Fetch all audio content
  useEffect(() => {
    const fetchAudio = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("content_uploads")
        .select("id, title, band_name, audio_url, video_url, thumbnail_url, content_type, duration, views_count, audio_duration_seconds")
        .eq("status", "approved")
        .not("audio_url", "is", null)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAllAudio(data as AudioContent[]);
      }
      setLoading(false);
    };
    fetchAudio();
  }, []);

  // Fetch playlist tracks when selected
  useEffect(() => {
    if (!selectedPlaylistId) return;
    const fetchPlaylistTracks = async () => {
      setPlaylistLoading(true);
      const items = await getPlaylistItems(selectedPlaylistId);
      const tracks = items
        .map((item: any) => item.content)
        .filter((c: any) => c && c.audio_url);
      setPlaylistTracks(tracks);
      setPlaylistLoading(false);
    };
    fetchPlaylistTracks();
  }, [selectedPlaylistId]);

  const favoriteTracks = useMemo(
    () => allAudio.filter((t) => favorites.has(t.id)),
    [allAudio, favorites]
  );

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSelectedPlaylistId(null);
  };

  const handlePlaylistSelect = (playlistId: string) => {
    setActiveView(`playlist-${playlistId}`);
    setSelectedPlaylistId(playlistId);
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  // Determine what to show
  let tracks = allAudio;
  let title = "Todo el Audio";
  let subtitle = "Toda la música y podcasts disponibles";
  let headerImage: React.ReactNode | undefined;

  if (activeView === "favorites") {
    tracks = favoriteTracks;
    title = "Canciones que te gustan";
    subtitle = `${favoriteTracks.length} canciones favoritas`;
    headerImage = (
      <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
        <Heart className="h-16 w-16 text-primary-foreground" fill="currentColor" />
      </div>
    );
  } else if (selectedPlaylistId && selectedPlaylist) {
    tracks = playlistTracks;
    title = selectedPlaylist.name;
    subtitle = selectedPlaylist.description || `${playlistTracks.length} canciones`;
    headerImage = selectedPlaylist.thumbnail_url ? (
      <img
        src={selectedPlaylist.thumbnail_url}
        alt={selectedPlaylist.name}
        className="w-48 h-48 rounded-lg object-cover shadow-lg"
      />
    ) : undefined;
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <AudioSidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          onPlaylistSelect={handlePlaylistSelect}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main content */}
        <AudioTrackList
          tracks={tracks}
          title={title}
          subtitle={subtitle}
          headerImage={headerImage}
          loading={activeView.startsWith("playlist-") ? playlistLoading : loading}
        />
      </div>

      {/* Bottom player */}
      <AudioBottomPlayer />
    </div>
  );
};

export default OnDemandAudio;
