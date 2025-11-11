import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites(new Set());
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('content_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(new Set(data.map(fav => fav.content_id)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (contentId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar favoritos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const isFavorite = favorites.has(contentId);

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId);

        if (error) throw error;

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(contentId);
          return newSet;
        });

        toast({
          title: "Eliminado de favoritos",
          description: "El video fue eliminado de tu lista",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            content_id: contentId,
          });

        if (error) throw error;

        setFavorites(prev => new Set(prev).add(contentId));

        toast({
          title: "Agregado a favoritos",
          description: "El video fue agregado a tu lista",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar tu lista de favoritos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (contentId: string) => favorites.has(contentId);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    loading,
    refetch: fetchFavorites,
  };
};
