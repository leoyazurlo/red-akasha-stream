import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Headphones, Calendar, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Podcasts() {
  const { user, isAdmin, loading } = useAuth(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadEpisodes();
  }, []);

  const loadEpisodes = async () => {
    try {
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEpisodes(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los episodios',
        variant: 'destructive',
      });
    } finally {
      setLoadingEpisodes(false);
    }
  };

  if (loading || loadingEpisodes) {
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
            <h1 className="text-3xl font-bold">Podcasts</h1>
            <p className="text-muted-foreground">Gestiona episodios de podcast</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Episodio
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {episodes.map((episode) => (
            <Card key={episode.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1">{episode.title}</CardTitle>
                  {episode.published_at && <Badge>Publicado</Badge>}
                </div>
                <CardDescription className="line-clamp-2">
                  {episode.podcast_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    <span>Por: {episode.profiles?.username || 'Desconocido'}</span>
                  </div>
                  {episode.episode_number && (
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      <span>Episodio {episode.episode_number}</span>
                    </div>
                  )}
                  {episode.published_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(episode.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {episodes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Headphones className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay episodios disponibles</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
