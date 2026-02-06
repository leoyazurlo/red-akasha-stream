import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Follower {
  id: string;
  follower_id: string;
  created_at: string;
  profile?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    profile_type: string;
    ciudad: string;
    pais: string;
  };
}

const profileTypeLabels: Record<string, string> = {
  agrupacion_musical: "Agrupación Musical",
  sala_concierto: "Sala de Concierto",
  estudio_grabacion: "Estudio de Grabación",
  productor_artistico: "Productor Artístico",
  promotor_artistico: "Promotor Artístico",
  productor_audiovisual: "Productor Audiovisual",
  musico: "Músico",
  dj: "DJ",
  vj: "VJ",
  sello_discografico: "Sello Discográfico",
  management: "Management",
  representante: "Representante",
  marketing_digital: "Marketing Digital",
  contenido: "Creador de Contenido",
  arte_digital: "Arte Digital",
  percusion: "Percusión",
  danza: "Danza",
  melomano: "Melómano"
};

interface FollowersListProps {
  userId: string;
  followersCount: number;
  isLoggedIn: boolean;
  showAsDialog?: boolean;
}

export const FollowersList = ({ userId, followersCount, isLoggedIn, showAsDialog = true }: FollowersListProps) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchFollowers = async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    try {
      // Get followers (user IDs that follow this user)
      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select('id, follower_id, created_at')
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowers([]);
        return;
      }

      // Get profile details for each follower
      const followerIds = followsData.map(f => f.follower_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profile_details')
        .select('id, user_id, display_name, avatar_url, profile_type, ciudad, pais')
        .in('user_id', followerIds);

      if (profilesError) throw profilesError;

      // Merge data
      const followersWithProfiles = followsData.map(follow => {
        const profile = profilesData?.find(p => p.user_id === follow.follower_id);
        return {
          ...follow,
          profile: profile ? {
            id: profile.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            profile_type: profile.profile_type,
            ciudad: profile.ciudad,
            pais: profile.pais
          } : undefined
        };
      });

      setFollowers(followersWithProfiles);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((open || !showAsDialog) && isLoggedIn) {
      fetchFollowers();
    }
  }, [open, userId, isLoggedIn, showAsDialog]);

  const handleProfileClick = (profileId: string) => {
    setOpen(false);
    navigate(`/circuito/perfil/${profileId}`);
  };

  const FollowersContent = () => (
    <>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : followers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aún no tiene seguidores</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {followers.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => follower.profile && handleProfileClick(follower.profile.id)}
              >
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarImage src={follower.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {follower.profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {follower.profile?.display_name || 'Usuario'}
                  </p>
                  {follower.profile && (
                    <>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary/80">
                        {profileTypeLabels[follower.profile.profile_type] || follower.profile.profile_type}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {follower.profile.ciudad}, {follower.profile.pais}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );

  // For MiPerfil tab view - show content directly
  if (!showAsDialog) {
    return <FollowersContent />;
  }

  // For PublicProfile - show as dialog when logged in
  if (!isLoggedIn) {
    return (
      <div className="text-center">
        <span className="block text-2xl font-bold text-primary">{followersCount}</span>
        <span className="text-muted-foreground">Seguidores</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-center hover:opacity-80 transition-opacity cursor-pointer">
          <span className="block text-2xl font-bold text-primary">{followersCount}</span>
          <span className="text-muted-foreground hover:text-primary transition-colors">Seguidores</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Seguidores ({followersCount})
          </DialogTitle>
        </DialogHeader>
        <FollowersContent />
      </DialogContent>
    </Dialog>
  );
};
