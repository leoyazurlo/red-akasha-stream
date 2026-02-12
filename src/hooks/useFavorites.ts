/**
 * @fileoverview Hook para manejar favoritos de contenido.
 * Permite agregar/quitar contenido de la lista de favoritos del usuario.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

/** Resultado del hook useFavorites */
interface UseFavoritesResult {
  /** Set de IDs de contenido marcado como favorito */
  favorites: Set<string>;
  /** Función para alternar el estado de favorito */
  toggleFavorite: (contentId: string) => Promise<void>;
  /** Verifica si un contenido es favorito */
  isFavorite: (contentId: string) => boolean;
  /** Si hay una operación en progreso */
  loading: boolean;
  /** Recarga la lista de favoritos */
  refetch: () => Promise<void>;
}

/**
 * Hook para gestionar los favoritos del usuario.
 * 
 * @returns Estado y acciones de favoritos
 * 
 * @example
 * ```tsx
 * const { isFavorite, toggleFavorite } = useFavorites();
 * 
 * <Button onClick={() => toggleFavorite(videoId)}>
 *   {isFavorite(videoId) ? "Quitar" : "Agregar"}
 * </Button>
 * ```
 */
export const useFavorites = (): UseFavoritesResult => {
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

    const wasFavorite = favorites.has(contentId);

    // Optimistic update
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (wasFavorite) {
        newSet.delete(contentId);
      } else {
        newSet.add(contentId);
      }
      return newSet;
    });

    setLoading(true);

    try {
      if (wasFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId);

        if (error) throw error;

        try {
          await supabase.rpc('decrement_likes' as any, { content_id: contentId });
        } catch (e) {
          console.error('Error decrementing likes:', e);
        }

        toast({
          title: "Eliminado de favoritos",
          description: "El video fue eliminado de tu lista",
        });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            content_id: contentId,
          });

        if (error) throw error;

        try {
          await supabase.rpc('increment_likes' as any, { content_id: contentId });
        } catch (e) {
          console.error('Error incrementing likes:', e);
        }

        toast({
          title: "Agregado a favoritos",
          description: "El video fue agregado a tu lista",
        });
      }
    } catch (error) {
      // Rollback on error
      setFavorites(prev => {
        const newSet = new Set(prev);
        if (wasFavorite) {
          newSet.add(contentId);
        } else {
          newSet.delete(contentId);
        }
        return newSet;
      });
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
