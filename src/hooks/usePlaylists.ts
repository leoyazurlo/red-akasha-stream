import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items_count?: number;
}

interface PlaylistItem {
  id: string;
  playlist_id: string;
  content_id: string;
  order_index: number;
  added_at: string;
}

export const usePlaylists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [user]);

  const fetchPlaylists = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          items_count:playlist_items(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform count data
      const playlistsWithCount = (data || []).map(playlist => ({
        ...playlist,
        items_count: playlist.items_count?.[0]?.count || 0
      }));

      setPlaylists(playlistsWithCount);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las playlists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (name: string, description?: string, isPublic = false) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para crear playlists",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Playlist creada",
        description: `"${name}" fue creada exitosamente`,
      });

      await fetchPlaylists();
      return data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la playlist",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePlaylist = async (
    playlistId: string,
    updates: { name?: string; description?: string; is_public?: boolean }
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('playlists')
        .update(updates)
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Playlist actualizada",
        description: "Los cambios fueron guardados",
      });

      await fetchPlaylists();
      return true;
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la playlist",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Playlist eliminada",
        description: "La playlist fue eliminada exitosamente",
      });

      await fetchPlaylists();
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la playlist",
        variant: "destructive",
      });
      return false;
    }
  };

  const addToPlaylist = async (playlistId: string, contentId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar videos a playlists",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Get current max order index
      const { data: items } = await supabase
        .from('playlist_items')
        .select('order_index')
        .eq('playlist_id', playlistId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = items && items.length > 0 ? items[0].order_index + 1 : 0;

      const { error } = await supabase
        .from('playlist_items')
        .insert({
          playlist_id: playlistId,
          content_id: contentId,
          order_index: nextOrder,
        });

      if (error) {
        // Check if it's a duplicate error
        if (error.code === '23505') {
          toast({
            title: "Video ya está en la playlist",
            description: "Este video ya existe en esta playlist",
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "Video agregado",
        description: "El video fue agregado a la playlist",
      });

      await fetchPlaylists();
      return true;
    } catch (error) {
      console.error('Error adding to playlist:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el video a la playlist",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromPlaylist = async (playlistId: string, contentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('content_id', contentId);

      if (error) throw error;

      toast({
        title: "Video eliminado",
        description: "El video fue eliminado de la playlist",
      });

      return true;
    } catch (error) {
      console.error('Error removing from playlist:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el video de la playlist",
        variant: "destructive",
      });
      return false;
    }
  };

  const getPlaylistItems = async (playlistId: string) => {
    try {
      const { data, error } = await supabase
        .from('playlist_items')
        .select(`
          *,
          content:content_uploads(*)
        `)
        .eq('playlist_id', playlistId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching playlist items:', error);
      return [];
    }
  };

  return {
    playlists,
    loading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylistItems,
    refetch: fetchPlaylists,
  };
};
