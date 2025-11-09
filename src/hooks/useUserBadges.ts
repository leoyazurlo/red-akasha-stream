import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserBadges = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          id,
          earned_at,
          badge:forum_badges (
            id,
            name,
            description,
            badge_type,
            icon,
            requirement_description
          )
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useUserStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-stats", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Contar hilos
      const { count: threadsCount } = await supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId);

      // Contar posts
      const { count: postsCount } = await supabase
        .from("forum_posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId);

      // Contar votos positivos recibidos
      const { data: votesData } = await supabase
        .from("forum_votes")
        .select(`
          vote_value,
          post:forum_posts!inner(author_id),
          thread:forum_threads!inner(author_id)
        `)
        .or(`post.author_id.eq.${userId},thread.author_id.eq.${userId}`)
        .gt("vote_value", 0);

      const positiveVotes = votesData?.length || 0;

      // Contar mejores respuestas
      const { count: bestAnswersCount } = await supabase
        .from("forum_posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .eq("is_best_answer", true);

      return {
        threads: threadsCount || 0,
        posts: postsCount || 0,
        positiveVotes,
        bestAnswers: bestAnswersCount || 0,
      };
    },
    enabled: !!userId,
  });
};
