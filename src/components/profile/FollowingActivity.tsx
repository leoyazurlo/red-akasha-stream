import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Activity {
  id: string;
  type: 'thread' | 'post';
  title: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  thread_id?: string;
}

export const FollowingActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener usuarios seguidos
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!following || following.length === 0) {
        setIsLoading(false);
        return;
      }

      const followingIds = following.map(f => f.following_id);

      // Obtener hilos recientes
      const { data: threads } = await supabase
        .from('forum_threads')
        .select(`
          id,
          title,
          content,
          created_at,
          author_id,
          profiles:author_id (
            username,
            avatar_url
          )
        `)
        .in('author_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Obtener posts recientes
      const { data: posts } = await supabase
        .from('forum_posts')
        .select(`
          id,
          content,
          created_at,
          author_id,
          thread_id,
          forum_threads!inner (
            title
          ),
          profiles:author_id (
            username,
            avatar_url
          )
        `)
        .in('author_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Combinar y ordenar
      const combined: Activity[] = [
        ...(threads || []).map(t => ({
          id: t.id,
          type: 'thread' as const,
          title: t.title,
          content: t.content,
          created_at: t.created_at,
          user: {
            id: t.author_id,
            username: (t.profiles as any)?.username || 'Usuario',
            avatar_url: (t.profiles as any)?.avatar_url || null,
          },
        })),
        ...(posts || []).map(p => ({
          id: p.id,
          type: 'post' as const,
          title: (p.forum_threads as any)?.title || 'Hilo',
          content: p.content,
          created_at: p.created_at,
          thread_id: p.thread_id,
          user: {
            id: p.author_id,
            username: (p.profiles as any)?.username || 'Usuario',
            avatar_url: (p.profiles as any)?.avatar_url || null,
          },
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(combined.slice(0, 15));
      setIsLoading(false);
    };

    loadActivities();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-semibold text-foreground mb-2">
          No hay actividad reciente
        </h3>
        <p className="text-sm text-muted-foreground">
          Sigue a otros usuarios para ver su actividad aquí
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={`${activity.type}-${activity.id}`} className="p-4 hover:bg-accent/50 transition-colors">
          <Link to={activity.type === 'thread' ? `/hilo/${activity.id}` : `/hilo/${activity.thread_id}`}>
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={activity.user.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {activity.user.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/perfil/${activity.user.id}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {activity.user.username}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {activity.type === 'thread' ? 'creó un hilo' : 'comentó en'}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {activity.type === 'thread' ? (
                      <FileText className="h-3 w-3" />
                    ) : (
                      <MessageSquare className="h-3 w-3" />
                    )}
                  </div>
                </div>
                
                <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
                  {activity.title}
                </h4>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {activity.content}
                </p>
                
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
};
