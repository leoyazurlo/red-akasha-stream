import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Star, Play, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TopVideo {
  id: string;
  title: string;
  band_name: string | null;
  content_type: string;
  likes_count: number;
  views_count: number | null;
  shares_count: number | null;
  thumbnail_url: string | null;
  uploader_id: string;
  uploader_name?: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  video_musical_vivo: 'Video Musical en Vivo',
  video_clip: 'Video Clip',
  podcast: 'Podcast',
  corto: 'Cortometraje',
  documental: 'Documental',
  pelicula: 'Película',
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  video_musical_vivo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  video_clip: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  podcast: 'bg-green-500/20 text-green-400 border-green-500/30',
  corto: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  documental: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  pelicula: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

export function Top100Videos() {
  const [videos, setVideos] = useState<TopVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalViews: 0,
    totalShares: 0,
    avgLikes: 0,
  });

  useEffect(() => {
    fetchTop100();
  }, []);

  const fetchTop100 = async () => {
    try {
      setLoading(true);
      
      // Fetch top 100 videos by likes
      const { data: videosData, error: videosError } = await supabase
        .from('content_uploads')
        .select('id, title, band_name, content_type, likes_count, views_count, shares_count, thumbnail_url, uploader_id')
        .eq('status', 'approved')
        .order('likes_count', { ascending: false })
        .limit(100);

      if (videosError) throw videosError;

      if (!videosData || videosData.length === 0) {
        setVideos([]);
        return;
      }

      // Get unique uploader IDs
      const uploaderIds = [...new Set(videosData.map(v => v.uploader_id))];

      // Fetch uploader names from profile_details
      const { data: profilesData } = await supabase
        .from('profile_details')
        .select('user_id, display_name')
        .in('user_id', uploaderIds);

      // Create a map of user_id to display_name
      const nameMap: Record<string, string> = {};
      profilesData?.forEach(p => {
        if (p.display_name) nameMap[p.user_id] = p.display_name;
      });

      // Merge uploader names into videos
      const videosWithNames = videosData.map(video => ({
        ...video,
        uploader_name: nameMap[video.uploader_id] || 'Desconocido'
      }));

      setVideos(videosWithNames);

      // Calculate stats
      const totalLikes = videosData.reduce((sum, v) => sum + (v.likes_count || 0), 0);
      const totalViews = videosData.reduce((sum, v) => sum + (v.views_count || 0), 0);
      const totalShares = videosData.reduce((sum, v) => sum + (v.shares_count || 0), 0);
      
      setStats({
        totalLikes,
        totalViews,
        totalShares,
        avgLikes: videosData.length > 0 ? totalLikes / videosData.length : 0,
      });

    } catch (error) {
      console.error('Error fetching top 100:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Top 100 Videos con Más Puntuación</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ranking basado en likes recibidos
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalLikes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Likes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Vistas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.totalShares.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Shares</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay videos con puntuación disponibles
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead className="w-20">Preview</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Artista/Creador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">
                    <Star className="w-4 h-4 inline mr-1" />
                    Likes
                  </TableHead>
                  <TableHead className="text-center">
                    <Play className="w-4 h-4 inline mr-1" />
                    Vistas
                  </TableHead>
                  <TableHead className="text-center">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Shares
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video, index) => (
                  <TableRow key={video.id} className="group">
                    <TableCell className="text-center font-bold">
                      {index < 3 ? (
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          'bg-orange-600/20 text-orange-400'
                        }`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-10 rounded overflow-hidden bg-secondary/30">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium truncate max-w-[200px]" title={video.title}>
                        {video.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {video.band_name || video.uploader_name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${CONTENT_TYPE_COLORS[video.content_type] || ''}`}
                      >
                        {CONTENT_TYPE_LABELS[video.content_type] || video.content_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-primary">
                        {video.likes_count?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {video.views_count?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {video.shares_count?.toLocaleString() || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
