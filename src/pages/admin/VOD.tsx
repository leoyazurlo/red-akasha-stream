import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Film, Eye, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function VOD() {
  const { user, isAdmin, loading } = useAuth(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('vod_videos')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los videos',
        variant: 'destructive',
      });
    } finally {
      setLoadingVideos(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      ready: 'default',
      processing: 'secondary',
      error: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading || loadingVideos) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Videos (VOD)</h1>
            <p className="text-muted-foreground">Gestiona videos bajo demanda</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Subir Video
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1">{video.title}</CardTitle>
                  {getStatusBadge(video.status)}
                </div>
                <CardDescription className="line-clamp-2">
                  {video.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    <span>Por: {video.profiles?.username || 'Desconocido'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{video.total_views || 0} vistas</span>
                  </div>
                  {video.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Duración: {video.duration}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {videos.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Film className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay videos disponibles</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
