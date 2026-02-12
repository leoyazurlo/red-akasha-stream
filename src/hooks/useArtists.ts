import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ArtistType = 
  | "musico" 
  | "percusion" 
  | "agrupacion" 
  | "dj" 
  | "vj" 
  | "danza" 
  | "fotografia_digital";

export interface Artist {
  id: string;
  user_id?: string;
  name: string;
  artist_type: ArtistType;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  city?: string;
  country?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  spotify_url?: string;
  youtube_url?: string;
  website?: string;
  followers_count: number;
  average_rating: number;
  total_votes: number;
  verified: boolean;
  created_at: string;
}

export const useArtists = (artistType?: ArtistType) => {
  return useQuery({
    queryKey: ["artists", artistType],
    queryFn: async () => {
      let query = supabase
        .from("artists")
        .select("*")
        .order("followers_count", { ascending: false });

      if (artistType) {
        query = query.eq("artist_type", artistType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Artist[];
    },
  });
};

export const useFollowArtist = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ artistId, isFollowing }: { artistId: string; isFollowing: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Debes iniciar sesión para seguir artistas");

      if (isFollowing) {
        const { error } = await supabase
          .from("artist_followers")
          .delete()
          .eq("artist_id", artistId)
          .eq("follower_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("artist_followers")
          .insert({ artist_id: artistId, follower_id: user.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ artistId, isFollowing }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["isFollowing", artistId] });
      await queryClient.cancelQueries({ queryKey: ["artists"] });

      // Snapshot previous values
      const previousIsFollowing = queryClient.getQueryData<boolean>(["isFollowing", artistId]);
      const previousArtists = queryClient.getQueryData<Artist[]>(["artists"]);

      // Optimistically update
      queryClient.setQueryData(["isFollowing", artistId], !isFollowing);
      queryClient.setQueriesData<Artist[]>({ queryKey: ["artists"] }, (old) =>
        old?.map((a) =>
          a.id === artistId
            ? { ...a, followers_count: a.followers_count + (isFollowing ? -1 : 1) }
            : a
        )
      );

      return { previousIsFollowing, previousArtists, artistId };
    },
    onError: (error: Error, variables, context) => {
      // Rollback
      if (context) {
        queryClient.setQueryData(["isFollowing", context.artistId], context.previousIsFollowing);
        queryClient.setQueriesData({ queryKey: ["artists"] }, context.previousArtists);
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["isFollowing", variables.artistId] });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isFollowing ? "Has dejado de seguir al artista" : "¡Ahora sigues a este artista!",
        description: variables.isFollowing ? "" : "Recibirás actualizaciones de su contenido",
      });
    },
  });
};

export const useIsFollowing = (artistId: string) => {
  return useQuery({
    queryKey: ["isFollowing", artistId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("artist_followers")
        .select("id")
        .eq("artist_id", artistId)
        .eq("follower_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
  });
};

export const useRateArtist = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ artistId, rating }: { artistId: string; rating: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Debes iniciar sesión para votar");

      const { error } = await supabase
        .from("artist_ratings")
        .upsert(
          { 
            artist_id: artistId, 
            user_id: user.id, 
            rating 
          },
          { onConflict: "artist_id,user_id" }
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["userRating", variables.artistId] });
      toast({
        title: "¡Gracias por tu voto!",
        description: `Has valorado al artista con ${variables.rating} estrellas`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUserRating = (artistId: string) => {
  return useQuery({
    queryKey: ["userRating", artistId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("artist_ratings")
        .select("rating")
        .eq("artist_id", artistId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.rating || null;
    },
  });
};
