import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Headphones, Calendar, Clock, Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Podcasts() {
  const { user, isAdmin, loading } = useAuth(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [loadingPodcasts, setLoadingPodcasts] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select('*')
        .eq('content_type', 'podcast')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPodcasts(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los podcasts',
        variant: 'destructive',
      });
    } finally {
      setLoadingPodcasts(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      published: 'default',
      draft: 'secondary',
      processing: 'secondary',
      error: 'destructive',
    };
    const labels: Record<string, string> = {
      published: 'Publicado',
      draft: 'Borrador',
      processing: 'Procesando',
      error: 'Error',
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryLabel = (category: string | null) => {
    const labels: Record<string, string> = {
      interview: 'Entrevista',
      music: 'Música',
      news: 'Noticias',
      education: 'Educación',
      entertainment: 'Entretenimiento',
      technology: 'Tecnología',
      culture: 'Cultura',
    };
    return category ? labels[category] || category : null;
  };

  if (loading || loadingPodcasts) {
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
            <p className="text-muted-foreground">Gestiona podcasts subidos por usuarios</p>
          </div>
          <Button onClick={() => navigate('/subir-contenido')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Podcast
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {podcasts.map((podcast) => (
            <Card key={podcast.id} className="overflow-hidden">
              {podcast.thumbnail_url && (
                <div className="aspect-square max-h-48 bg-muted">
                  <img 
                    src={podcast.thumbnail_url} 
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 text-base">{podcast.title}</CardTitle>
                  {getStatusBadge(podcast.status || 'draft')}
                </div>
                <CardDescription className="line-clamp-2">
                  {podcast.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {podcast.podcast_category && (
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(podcast.podcast_category)}
                    </Badge>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{podcast.views_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{podcast.likes_count || 0}</span>
                    </div>
                    {podcast.audio_duration_seconds && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(podcast.audio_duration_seconds)}</span>
                      </div>
                    )}
                  </div>
                  {podcast.created_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(podcast.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {podcasts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Headphones className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay podcasts disponibles</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/subir-contenido')}>
                Subir primer podcast
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
