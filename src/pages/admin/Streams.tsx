import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Radio, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Streams() {
  const { user, isAdmin, loading } = useAuth(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [streams, setStreams] = useState<any[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los streams',
        variant: 'destructive',
      });
    } finally {
      setLoadingStreams(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      live: 'destructive',
      scheduled: 'secondary',
      ended: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading || loadingStreams) {
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
            <h1 className="text-3xl font-bold">Streams en Vivo</h1>
            <p className="text-muted-foreground">Gestiona transmisiones en vivo</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Stream
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => (
            <Card key={stream.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1">{stream.title}</CardTitle>
                  {getStatusBadge(stream.status)}
                </div>
                <CardDescription className="line-clamp-2">
                  {stream.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4" />
                    <span>Streamer: {stream.profiles?.username || 'Desconocido'}</span>
                  </div>
                  {stream.scheduled_start_time && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(stream.scheduled_start_time).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Pico: {stream.peak_viewers || 0} espectadores</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {streams.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Radio className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay streams disponibles</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
