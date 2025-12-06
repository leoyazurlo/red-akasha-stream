import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageSquare, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ForumStats = () => {
  const { t } = useTranslation();
  
  const { data: stats } = useQuery({
    queryKey: ["forum-stats"],
    queryFn: async () => {
      const [threadsResult, postsResult, usersResult] = await Promise.all([
        supabase.from("forum_threads").select("id", { count: "exact", head: true }),
        supabase.from("forum_posts").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      return {
        threads: threadsResult.count || 0,
        posts: postsResult.count || 0,
        users: usersResult.count || 0,
      };
    },
  });

  const statItems = [
    { label: t('forum.stats.members'), value: stats?.users || 0, icon: Users },
    { label: t('forum.stats.debates'), value: stats?.threads || 0, icon: MessageSquare },
    { label: t('forum.stats.replies'), value: stats?.posts || 0, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 shadow-card"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <stat.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
