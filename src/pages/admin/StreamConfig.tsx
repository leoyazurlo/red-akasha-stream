import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Key, 
  Wifi, 
  WifiOff, 
  Calendar, 
  Image, 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit2, 
  Save,
  Youtube,
  Facebook,
  Instagram,
  Twitch,
  Radio,
  Globe,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PLATFORMS = [
  { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-500" },
  { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500" },
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { value: "twitch", label: "Twitch", icon: Twitch, color: "text-purple-500" },
  { value: "vimeo", label: "Vimeo", icon: Radio, color: "text-cyan-500" },
  { value: "x", label: "X (Twitter)", icon: Globe, color: "text-gray-400" },
  { value: "custom", label: "Personalizado", icon: Globe, color: "text-cyan-400" },
];

const OVERLAY_TYPES = [
  { value: "logo", label: "Logo" },
  { value: "banner", label: "Banner" },
  { value: "ticker", label: "Ticker de texto" },
  { value: "alert", label: "Alertas" },
  { value: "frame", label: "Marco" },
];

const POSITIONS = [
  { value: "top-left", label: "Arriba Izquierda" },
  { value: "top-right", label: "Arriba Derecha" },
  { value: "bottom-left", label: "Abajo Izquierda" },
  { value: "bottom-right", label: "Abajo Derecha" },
  { value: "center", label: "Centro" },
];

interface StreamingDestination {
  id: string;
  platform: string;
  name: string;
  rtmp_url: string;
  stream_key: string;
  playback_url: string | null;
  is_active: boolean;
  connection_status: string;
  last_connected_at: string | null;
}

interface ScheduledStream {
  id: string;
  title: string;
  description: string | null;
  scheduled_start: string;
  scheduled_end: string | null;
  destination_ids: string[];
  status: string;
  thumbnail_url: string | null;
}

interface StreamOverlay {
  id: string;
  name: string;
  overlay_type: string;
  position: string;
  image_url: string | null;
  text_content: string | null;
  is_active: boolean;
}

interface AnalyticsData {
  platform: string;
  viewers_peak: number;
  viewers_average: number;
  duration_minutes: number;
  likes: number;
  comments: number;
  shares: number;
  stream_date: string;
}

export default function StreamConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("destinations");
  const [isAddingDestination, setIsAddingDestination] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isAddingOverlay, setIsAddingOverlay] = useState(false);
  const [editingDestination, setEditingDestination] = useState<StreamingDestination | null>(null);

  // Form states
  const [newDestination, setNewDestination] = useState({
    platform: "",
    name: "",
    rtmp_url: "",
    stream_key: "",
    playback_url: "",
  });

  const [newSchedule, setNewSchedule] = useState({
    title: "",
    description: "",
    scheduled_start: "",
    scheduled_end: "",
    destination_ids: [] as string[],
  });

  const [newOverlay, setNewOverlay] = useState({
    name: "",
    overlay_type: "",
    position: "top-left",
    image_url: "",
    text_content: "",
  });

  // Queries
  const { data: destinations = [], isLoading: loadingDestinations } = useQuery({
    queryKey: ["streaming-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("streaming_destinations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StreamingDestination[];
    },
    enabled: !!user,
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["scheduled-streams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_streams")
        .select("*")
        .order("scheduled_start", { ascending: true });
      if (error) throw error;
      return data as ScheduledStream[];
    },
    enabled: !!user,
  });

  const { data: overlays = [], isLoading: loadingOverlays } = useQuery({
    queryKey: ["stream-overlays-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stream_overlays_config")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StreamOverlay[];
    },
    enabled: !!user,
  });

  const { data: analytics = [], isLoading: loadingAnalytics } = useQuery({
    queryKey: ["stream-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stream_analytics_log")
        .select("*")
        .order("stream_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as AnalyticsData[];
    },
    enabled: !!user,
  });

  // Mutations
  const addDestinationMutation = useMutation({
    mutationFn: async (destination: typeof newDestination) => {
      const { error } = await supabase.from("streaming_destinations").insert({
        ...destination,
        user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaming-destinations"] });
      setIsAddingDestination(false);
      setNewDestination({ platform: "", name: "", rtmp_url: "", stream_key: "", playback_url: "" });
      toast.success("Destino agregado correctamente");
    },
    onError: () => toast.error("Error al agregar destino"),
  });

  const updateDestinationMutation = useMutation({
    mutationFn: async (destination: StreamingDestination) => {
      const { error } = await supabase
        .from("streaming_destinations")
        .update({
          platform: destination.platform,
          name: destination.name,
          rtmp_url: destination.rtmp_url,
          stream_key: destination.stream_key,
          playback_url: destination.playback_url,
          is_active: destination.is_active,
        })
        .eq("id", destination.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaming-destinations"] });
      setEditingDestination(null);
      toast.success("Destino actualizado");
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteDestinationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("streaming_destinations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaming-destinations"] });
      toast.success("Destino eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const addScheduleMutation = useMutation({
    mutationFn: async (schedule: typeof newSchedule) => {
      const { error } = await supabase.from("scheduled_streams").insert({
        ...schedule,
        user_id: user?.id,
        scheduled_end: schedule.scheduled_end || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-streams"] });
      setIsAddingSchedule(false);
      setNewSchedule({ title: "", description: "", scheduled_start: "", scheduled_end: "", destination_ids: [] });
      toast.success("Stream programado correctamente");
    },
    onError: () => toast.error("Error al programar stream"),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheduled_streams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-streams"] });
      toast.success("Programación eliminada");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const addOverlayMutation = useMutation({
    mutationFn: async (overlay: typeof newOverlay) => {
      const { error } = await supabase.from("stream_overlays_config").insert({
        ...overlay,
        user_id: user?.id,
        image_url: overlay.image_url || null,
        text_content: overlay.text_content || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stream-overlays-config"] });
      setIsAddingOverlay(false);
      setNewOverlay({ name: "", overlay_type: "", position: "top-left", image_url: "", text_content: "" });
      toast.success("Overlay agregado correctamente");
    },
    onError: () => toast.error("Error al agregar overlay"),
  });

  const toggleOverlayMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("stream_overlays_config")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stream-overlays-config"] });
    },
  });

  const deleteOverlayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stream_overlays_config").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stream-overlays-config"] });
      toast.success("Overlay eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find(pl => pl.value === platform);
    if (!p) return Globe;
    return p.icon;
  };

  const getPlatformColor = (platform: string) => {
    const p = PLATFORMS.find(pl => pl.value === platform);
    return p?.color || "text-cyan-400";
  };

  const getConnectionBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Wifi className="w-3 h-3 mr-1" /> Conectado</Badge>;
      case "error":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><WifiOff className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><WifiOff className="w-3 h-3 mr-1" /> Desconectado</Badge>;
    }
  };

  // Analytics aggregation
  const aggregatedAnalytics = analytics.reduce((acc, item) => {
    const existing = acc.find(a => a.platform === item.platform);
    if (existing) {
      existing.total_viewers += item.viewers_peak;
      existing.total_likes += item.likes;
      existing.total_comments += item.comments;
      existing.total_shares += item.shares;
      existing.total_duration += item.duration_minutes;
      existing.count++;
    } else {
      acc.push({
        platform: item.platform,
        total_viewers: item.viewers_peak,
        total_likes: item.likes,
        total_comments: item.comments,
        total_shares: item.shares,
        total_duration: item.duration_minutes,
        count: 1,
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_hsl(180,100%,50%)]">
            Configuración de Streaming
          </h1>
          <p className="text-cyan-300/70 mt-2">
            Gestiona tus destinos de transmisión, programación, overlays y analytics
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 bg-black/40 border border-cyan-500/30">
            <TabsTrigger value="destinations" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Key className="w-4 h-4 mr-2" /> RTMP
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Wifi className="w-4 h-4 mr-2" /> Estado
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Calendar className="w-4 h-4 mr-2" /> Programar
            </TabsTrigger>
            <TabsTrigger value="overlays" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Image className="w-4 h-4 mr-2" /> Overlays
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
          </TabsList>

          {/* RTMP Destinations Tab */}
          <TabsContent value="destinations" className="mt-6">
            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-cyan-400">Destinos RTMP</CardTitle>
                  <CardDescription className="text-cyan-300/60">
                    Configura las plataformas donde transmitirás
                  </CardDescription>
                </div>
                <Dialog open={isAddingDestination} onOpenChange={setIsAddingDestination}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                      <Plus className="w-4 h-4 mr-2" /> Agregar Destino
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-cyan-500/30">
                    <DialogHeader>
                      <DialogTitle className="text-cyan-400">Nuevo Destino RTMP</DialogTitle>
                      <DialogDescription className="text-cyan-300/60">
                        Agrega una nueva plataforma de streaming
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-cyan-300">Plataforma</Label>
                        <Select 
                          value={newDestination.platform} 
                          onValueChange={(v) => {
                            let rtmpUrl = newDestination.rtmp_url;
                            let playbackUrl = newDestination.playback_url;
                            
                            // Autocompletar URLs según plataforma
                            if (v === 'twitch') {
                              rtmpUrl = 'rtmp://live.twitch.tv/app';
                            } else if (v === 'youtube') {
                              rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2';
                            } else if (v === 'facebook') {
                              rtmpUrl = 'rtmps://live-api-s.facebook.com:443/rtmp/';
                            }
                            
                            setNewDestination({ ...newDestination, platform: v, rtmp_url: rtmpUrl, playback_url: playbackUrl });
                          }}
                        >
                          <SelectTrigger className="bg-black/40 border-cyan-500/30 text-cyan-100">
                            <SelectValue placeholder="Seleccionar plataforma" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-cyan-500/30">
                            {PLATFORMS.map((p) => (
                              <SelectItem key={p.value} value={p.value} className="text-cyan-100">
                                <div className="flex items-center gap-2">
                                  <p.icon className={`w-4 h-4 ${p.color}`} />
                                  {p.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-cyan-300">Nombre / Canal</Label>
                        <Input
                          value={newDestination.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            let playbackUrl = newDestination.playback_url;
                            
                            // Si es Twitch, actualizar automáticamente el playback_url
                            if (newDestination.platform === 'twitch' && name) {
                              playbackUrl = `https://www.twitch.tv/${name.toLowerCase().replace(/\s+/g, '')}`;
                            }
                            
                            setNewDestination({ ...newDestination, name, playback_url: playbackUrl });
                          }}
                          placeholder={newDestination.platform === 'twitch' ? 'audiovisualesauditorio' : 'Mi canal'}
                          className="bg-black/40 border-cyan-500/30 text-cyan-100"
                        />
                        {newDestination.platform === 'twitch' && (
                          <p className="text-xs text-cyan-300/50 mt-1">
                            Ingresa el nombre de tu canal de Twitch (sin @)
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-cyan-300">URL RTMP</Label>
                        <Input
                          value={newDestination.rtmp_url}
                          onChange={(e) => setNewDestination({ ...newDestination, rtmp_url: e.target.value })}
                          placeholder="rtmp://live.twitch.tv/app"
                          className="bg-black/40 border-cyan-500/30 text-cyan-100"
                        />
                        {newDestination.platform === 'twitch' && (
                          <p className="text-xs text-green-400/70 mt-1">
                            ✓ URL RTMP de Twitch autocompletada
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-cyan-300">Stream Key (Clave de Transmisión)</Label>
                        <Input
                          type="password"
                          value={newDestination.stream_key}
                          onChange={(e) => setNewDestination({ ...newDestination, stream_key: e.target.value })}
                          placeholder="live_xxxxxxxxxxxxxxxxxx"
                          className="bg-black/40 border-cyan-500/30 text-cyan-100"
                        />
                        {newDestination.platform === 'twitch' && (
                          <p className="text-xs text-cyan-300/50 mt-1">
                            Encuéntrala en: twitch.tv/dashboard → Configuración → Stream
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-cyan-300">URL de Reproducción (Playback)</Label>
                        <Input
                          value={newDestination.playback_url}
                          onChange={(e) => setNewDestination({ ...newDestination, playback_url: e.target.value })}
                          placeholder={newDestination.platform === 'twitch' ? 'https://www.twitch.tv/tu_canal' : 'https://www.youtube.com/watch?v=VIDEO_ID'}
                          className="bg-black/40 border-cyan-500/30 text-cyan-100"
                        />
                        <p className="text-xs text-cyan-300/50 mt-1">
                          URL del video en vivo para mostrar en el reproductor principal
                        </p>
                      </div>
                      <Button
                        onClick={() => addDestinationMutation.mutate(newDestination)}
                        disabled={!newDestination.platform || !newDestination.name || !newDestination.rtmp_url || !newDestination.stream_key}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-black"
                      >
                        {addDestinationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Destino"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingDestinations ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  </div>
                ) : destinations.length === 0 ? (
                  <div className="text-center py-8 text-cyan-300/60">
                    No hay destinos configurados. Agrega uno para comenzar.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {destinations.map((dest) => {
                      const Icon = getPlatformIcon(dest.platform);
                      return (
                        <div key={dest.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-cyan-500/20">
                          <div className="flex items-center gap-4">
                            <Icon className={`w-8 h-8 ${getPlatformColor(dest.platform)}`} />
                            <div>
                              <p className="font-medium text-cyan-100">{dest.name}</p>
                              <p className="text-sm text-cyan-300/60">{dest.rtmp_url}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getConnectionBadge(dest.connection_status)}
                            <Switch
                              checked={dest.is_active}
                              onCheckedChange={(checked) => updateDestinationMutation.mutate({ ...dest, is_active: checked })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingDestination(dest)}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDestinationMutation.mutate(dest.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Destination Dialog */}
            <Dialog open={!!editingDestination} onOpenChange={(open) => !open && setEditingDestination(null)}>
              <DialogContent className="bg-gray-900 border-cyan-500/30">
                <DialogHeader>
                  <DialogTitle className="text-cyan-400">Editar Destino RTMP</DialogTitle>
                  <DialogDescription className="text-cyan-300/60">
                    Modifica los datos del destino de streaming
                  </DialogDescription>
                </DialogHeader>
                {editingDestination && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-cyan-300">Plataforma</Label>
                      <Select 
                        value={editingDestination.platform} 
                        onValueChange={(v) => {
                          let rtmpUrl = editingDestination.rtmp_url;
                          if (v === 'twitch') {
                            rtmpUrl = 'rtmp://live.twitch.tv/app';
                          } else if (v === 'youtube') {
                            rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2';
                          } else if (v === 'facebook') {
                            rtmpUrl = 'rtmps://live-api-s.facebook.com:443/rtmp/';
                          }
                          setEditingDestination({ ...editingDestination, platform: v, rtmp_url: rtmpUrl });
                        }}
                      >
                        <SelectTrigger className="bg-black/40 border-cyan-500/30 text-cyan-100">
                          <SelectValue placeholder="Seleccionar plataforma" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-cyan-500/30">
                          {PLATFORMS.map((p) => (
                            <SelectItem key={p.value} value={p.value} className="text-cyan-100">
                              <div className="flex items-center gap-2">
                                <p.icon className={`w-4 h-4 ${p.color}`} />
                                {p.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-cyan-300">Nombre / Canal</Label>
                      <Input
                        value={editingDestination.name}
                        onChange={(e) => setEditingDestination({ ...editingDestination, name: e.target.value })}
                        placeholder="Nombre del canal"
                        className="bg-black/40 border-cyan-500/30 text-cyan-100"
                      />
                    </div>
                    <div>
                      <Label className="text-cyan-300">URL RTMP</Label>
                      <Input
                        value={editingDestination.rtmp_url}
                        onChange={(e) => setEditingDestination({ ...editingDestination, rtmp_url: e.target.value })}
                        placeholder="rtmp://..."
                        className="bg-black/40 border-cyan-500/30 text-cyan-100"
                      />
                    </div>
                    <div>
                      <Label className="text-cyan-300">Stream Key</Label>
                      <Input
                        type="password"
                        value={editingDestination.stream_key}
                        onChange={(e) => setEditingDestination({ ...editingDestination, stream_key: e.target.value })}
                        placeholder="Tu clave de transmisión"
                        className="bg-black/40 border-cyan-500/30 text-cyan-100"
                      />
                    </div>
                    <div>
                      <Label className="text-cyan-300">URL de Reproducción (opcional)</Label>
                      <Input
                        value={editingDestination.playback_url || ''}
                        onChange={(e) => setEditingDestination({ ...editingDestination, playback_url: e.target.value })}
                        placeholder="https://www.twitch.tv/tu_canal"
                        className="bg-black/40 border-cyan-500/30 text-cyan-100"
                      />
                    </div>
                    <Button
                      onClick={() => updateDestinationMutation.mutate(editingDestination)}
                      disabled={!editingDestination.platform || !editingDestination.name || !editingDestination.rtmp_url || !editingDestination.stream_key}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-black"
                    >
                      {updateDestinationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Connection Status Tab */}
          <TabsContent value="status" className="mt-6">
            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Estado de Conexiones</CardTitle>
                <CardDescription className="text-cyan-300/60">
                  Monitorea el estado de tus destinos de streaming en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                {destinations.length === 0 ? (
                  <div className="text-center py-8 text-cyan-300/60">
                    No hay destinos configurados para monitorear.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {destinations.map((dest) => {
                      const Icon = getPlatformIcon(dest.platform);
                      return (
                        <Card key={dest.id} className={`bg-black/30 border-2 ${
                          dest.connection_status === "connected" ? "border-green-500/50" :
                          dest.connection_status === "error" ? "border-red-500/50" : "border-gray-500/30"
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-full ${
                                dest.connection_status === "connected" ? "bg-green-500/20" :
                                dest.connection_status === "error" ? "bg-red-500/20" : "bg-gray-500/20"
                              }`}>
                                <Icon className={`w-6 h-6 ${getPlatformColor(dest.platform)}`} />
                              </div>
                              <div>
                                <p className="font-medium text-cyan-100">{dest.name}</p>
                                <p className="text-xs text-cyan-300/60 capitalize">{dest.platform}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              {getConnectionBadge(dest.connection_status)}
                              {dest.last_connected_at && (
                                <span className="text-xs text-cyan-300/50">
                                  Última conexión: {new Date(dest.last_connected_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-6">
            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-cyan-400">Programación de Streams</CardTitle>
                  <CardDescription className="text-cyan-300/60">
                    Programa tus transmisiones con anticipación
                  </CardDescription>
                </div>
                <Dialog open={isAddingSchedule} onOpenChange={setIsAddingSchedule}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                      <Plus className="w-4 h-4 mr-2" /> Programar Stream
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-cyan-500/30">
                    <DialogHeader>
                      <DialogTitle className="text-cyan-400">Programar Nuevo Stream</DialogTitle>
                      <DialogDescription className="text-cyan-300/60">
                        Define los detalles de tu próxima transmisión
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-cyan-300">Título</Label>
                        <Input
                          value={newSchedule.title}
                          onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                          placeholder="Live DJ Session"
                          className="bg-black/40 border-cyan-500/30 text-cyan-100"
                        />
                      </div>
                      <div>
                        <Label className="text-cyan-300">Descripción</Label>
                        <Textarea
                          value={newSchedule.description}
                          onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                          placeholder="Sesión de música electrónica..."
                          className="bg-black/40 border-cyan-500/30 text-cyan-100"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-cyan-300">Fecha/Hora Inicio</Label>
                          <Input
                            type="datetime-local"
                            value={newSchedule.scheduled_start}
                            onChange={(e) => setNewSchedule({ ...newSchedule, scheduled_start: e.target.value })}
                            className="bg-black/40 border-cyan-500/30 text-cyan-100"
                          />
                        </div>
                        <div>
                          <Label className="text-cyan-300">Fecha/Hora Fin (opcional)</Label>
                          <Input
                            type="datetime-local"
                            value={newSchedule.scheduled_end}
                            onChange={(e) => setNewSchedule({ ...newSchedule, scheduled_end: e.target.value })}
                            className="bg-black/40 border-cyan-500/30 text-cyan-100"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => addScheduleMutation.mutate(newSchedule)}
                        disabled={!newSchedule.title || !newSchedule.scheduled_start}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-black"
                      >
                        {addScheduleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Programar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingSchedules ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-8 text-cyan-300/60">
                    No hay streams programados.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-cyan-500/20">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-cyan-500/10 rounded-lg">
                            <Calendar className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <p className="font-medium text-cyan-100">{schedule.title}</p>
                            <div className="flex items-center gap-2 text-sm text-cyan-300/60">
                              <Clock className="w-4 h-4" />
                              {new Date(schedule.scheduled_start).toLocaleString()}
                              {schedule.scheduled_end && ` - ${new Date(schedule.scheduled_end).toLocaleTimeString()}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${
                            schedule.status === "live" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                            schedule.status === "completed" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                            "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                          }`}>
                            {schedule.status === "live" ? "EN VIVO" :
                             schedule.status === "completed" ? "Completado" :
                             schedule.status === "cancelled" ? "Cancelado" : "Programado"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overlays Tab */}
          <TabsContent value="overlays" className="mt-6">
            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-cyan-400">Overlays Personalizados</CardTitle>
                  <CardDescription className="text-cyan-300/60">
                    Configura gráficos y elementos visuales para tus streams
                  </CardDescription>
                </div>
                <Dialog open={isAddingOverlay} onOpenChange={setIsAddingOverlay}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                      <Plus className="w-4 h-4 mr-2" /> Agregar Overlay
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-cyan-500/30">
                    <DialogHeader>
                      <DialogTitle className="text-cyan-400">Nuevo Overlay</DialogTitle>
                      <DialogDescription className="text-cyan-300/60">
                        Crea un elemento visual para tu transmisión
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-cyan-300">Nombre</Label>
                        <Input
                          value={newOverlay.name}
                          onChange={(e) => setNewOverlay({ ...newOverlay, name: e.target.value })}
                          placeholder="Logo principal"
                          className="bg-black/40 border-cyan-500/30 text-cyan-100"
                        />
                      </div>
                      <div>
                        <Label className="text-cyan-300">Tipo</Label>
                        <Select value={newOverlay.overlay_type} onValueChange={(v) => setNewOverlay({ ...newOverlay, overlay_type: v })}>
                          <SelectTrigger className="bg-black/40 border-cyan-500/30 text-cyan-100">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-cyan-500/30">
                            {OVERLAY_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value} className="text-cyan-100">
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-cyan-300">Posición</Label>
                        <Select value={newOverlay.position} onValueChange={(v) => setNewOverlay({ ...newOverlay, position: v })}>
                          <SelectTrigger className="bg-black/40 border-cyan-500/30 text-cyan-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-cyan-500/30">
                            {POSITIONS.map((p) => (
                              <SelectItem key={p.value} value={p.value} className="text-cyan-100">
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-cyan-300">URL de Imagen (opcional)</Label>
                        <Input
                          value={newOverlay.image_url}
                          onChange={(e) => setNewOverlay({ ...newOverlay, image_url: e.target.value })}
                          placeholder="https://..."
                          className="bg-black/40 border-cyan-500/30 text-cyan-100"
                        />
                      </div>
                      <div>
                        <Label className="text-cyan-300">Texto (opcional)</Label>
                        <Input
                          value={newOverlay.text_content}
                          onChange={(e) => setNewOverlay({ ...newOverlay, text_content: e.target.value })}
                          placeholder="Texto del ticker..."
                          className="bg-black/40 border-cyan-500/30 text-cyan-100"
                        />
                      </div>
                      <Button
                        onClick={() => addOverlayMutation.mutate(newOverlay)}
                        disabled={!newOverlay.name || !newOverlay.overlay_type}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-black"
                      >
                        {addOverlayMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Overlay"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingOverlays ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  </div>
                ) : overlays.length === 0 ? (
                  <div className="text-center py-8 text-cyan-300/60">
                    No hay overlays configurados.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overlays.map((overlay) => (
                      <Card key={overlay.id} className="bg-black/30 border-cyan-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Image className="w-5 h-5 text-cyan-400" />
                              <span className="font-medium text-cyan-100">{overlay.name}</span>
                            </div>
                            <Switch
                              checked={overlay.is_active}
                              onCheckedChange={(checked) => toggleOverlayMutation.mutate({ id: overlay.id, is_active: checked })}
                            />
                          </div>
                          <div className="space-y-2 text-sm text-cyan-300/60">
                            <p>Tipo: {OVERLAY_TYPES.find(t => t.value === overlay.overlay_type)?.label}</p>
                            <p>Posición: {POSITIONS.find(p => p.value === overlay.position)?.label}</p>
                            {overlay.text_content && <p>Texto: {overlay.text_content}</p>}
                          </div>
                          <div className="flex justify-end mt-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteOverlayMutation.mutate(overlay.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Analytics Multiplatforma</CardTitle>
                <CardDescription className="text-cyan-300/60">
                  Métricas unificadas de todas tus transmisiones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  </div>
                ) : aggregatedAnalytics.length === 0 ? (
                  <div className="text-center py-8 text-cyan-300/60">
                    No hay datos de analytics disponibles.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-cyan-300/60 mb-2">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">Total Viewers</span>
                          </div>
                          <p className="text-2xl font-bold text-cyan-400">
                            {aggregatedAnalytics.reduce((acc, a) => acc + a.total_viewers, 0).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-red-300/60 mb-2">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">Total Likes</span>
                          </div>
                          <p className="text-2xl font-bold text-red-400">
                            {aggregatedAnalytics.reduce((acc, a) => acc + a.total_likes, 0).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-blue-300/60 mb-2">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">Comentarios</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-400">
                            {aggregatedAnalytics.reduce((acc, a) => acc + a.total_comments, 0).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-green-300/60 mb-2">
                            <Share2 className="w-4 h-4" />
                            <span className="text-sm">Compartidos</span>
                          </div>
                          <p className="text-2xl font-bold text-green-400">
                            {aggregatedAnalytics.reduce((acc, a) => acc + a.total_shares, 0).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Per Platform */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-cyan-300">Por Plataforma</h3>
                      {aggregatedAnalytics.map((platform) => {
                        const Icon = getPlatformIcon(platform.platform);
                        return (
                          <div key={platform.platform} className="p-4 bg-black/30 rounded-lg border border-cyan-500/20">
                            <div className="flex items-center gap-4 mb-4">
                              <Icon className={`w-8 h-8 ${getPlatformColor(platform.platform)}`} />
                              <div>
                                <p className="font-medium text-cyan-100 capitalize">{platform.platform}</p>
                                <p className="text-sm text-cyan-300/60">{platform.count} transmisiones</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-cyan-400">{platform.total_viewers.toLocaleString()}</p>
                                <p className="text-xs text-cyan-300/60">Viewers</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-red-400">{platform.total_likes.toLocaleString()}</p>
                                <p className="text-xs text-cyan-300/60">Likes</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-blue-400">{platform.total_comments.toLocaleString()}</p>
                                <p className="text-xs text-cyan-300/60">Comentarios</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-400">{Math.round(platform.total_duration / 60)}h</p>
                                <p className="text-xs text-cyan-300/60">Horas</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}