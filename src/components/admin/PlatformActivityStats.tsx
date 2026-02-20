import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Activity, MessageSquare, Award, Users, TrendingUp, Trophy } from "lucide-react";

const getBadgeColor = (badgeType: string) => {
  switch (badgeType) {
    case "bronze": return "bg-amber-700/20 text-amber-300 border-amber-700/50";
    case "silver": return "bg-slate-400/20 text-slate-200 border-slate-400/50";
    case "gold": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
    case "special": return "bg-purple-500/20 text-purple-300 border-purple-500/50";
    case "merit": return "bg-green-500/20 text-green-300 border-green-500/50";
    default: return "bg-muted text-muted-foreground";
  }
};

const getBadgeTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    bronze: "Bronce", silver: "Plata", gold: "Oro", special: "Especial", merit: "Mérito",
  };
  return labels[type] || type;
};

export const PlatformActivityStats = () => {
  const { data: forumStats, isLoading: forumLoading } = useQuery({
    queryKey: ["admin-forum-stats"],
    queryFn: async () => {
      const [threadsRes, postsRes, votesRes, bestAnswersRes] = await Promise.all([
        supabase.from("forum_threads").select("*", { count: "exact", head: true }),
        supabase.from("forum_posts").select("*", { count: "exact", head: true }),
        supabase.from("forum_votes").select("*", { count: "exact", head: true }).gt("vote_value", 0),
        supabase.from("forum_posts").select("*", { count: "exact", head: true }).eq("is_best_answer", true),
      ]);

      return {
        threads: threadsRes.count || 0,
        posts: postsRes.count || 0,
        positiveVotes: votesRes.count || 0,
        bestAnswers: bestAnswersRes.count || 0,
      };
    },
  });

  const { data: followStats, isLoading: followLoading } = useQuery({
    queryKey: ["admin-follow-stats"],
    queryFn: async () => {
      const { count } = await supabase
        .from("artist_followers")
        .select("*", { count: "exact", head: true });
      return { totalFollows: count || 0 };
    },
  });

  const { data: badgeStats, isLoading: badgesLoading } = useQuery({
    queryKey: ["admin-badge-stats"],
    queryFn: async () => {
      const [earnedRes, availableRes] = await Promise.all([
        supabase.from("user_badges").select("id, badge:forum_badges(badge_type)"),
        supabase.from("forum_badges").select("*").order("badge_type").order("name"),
      ]);

      const earned = earnedRes.data || [];
      const byType: Record<string, number> = {};
      earned.forEach((ub: any) => {
        const type = ub.badge?.badge_type || "unknown";
        byType[type] = (byType[type] || 0) + 1;
      });

      return {
        totalEarned: earned.length,
        totalAvailable: availableRes.data?.length || 0,
        byType,
      };
    },
  });

  const { data: userStats, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return { totalUsers: count || 0 };
    },
  });

  const isLoading = forumLoading || followLoading || badgesLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
          Datos de Movimientos
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{userStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en la plataforma</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-teal-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seguidores</CardTitle>
            <TrendingUp className="h-5 w-5 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-500">{followStats?.totalFollows || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Relaciones de seguimiento</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Otorgados</CardTitle>
            <Award className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">{badgeStats?.totalEarned || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">De {badgeStats?.totalAvailable || 0} disponibles</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-yellow-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejores Respuestas</CardTitle>
            <Trophy className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{forumStats?.bestAnswers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Respuestas destacadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Forum Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Actividad del Foro
            </CardTitle>
            <CardDescription>Estadísticas globales del foro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de hilos</span>
                <span className="text-2xl font-bold">{forumStats?.threads || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de posts</span>
                <span className="text-2xl font-bold">{forumStats?.posts || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Votos positivos</span>
                <span className="text-2xl font-bold text-green-500">{forumStats?.positiveVotes || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mejores respuestas</span>
                <span className="text-2xl font-bold text-yellow-500">{forumStats?.bestAnswers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badge Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Resumen de Badges
            </CardTitle>
            <CardDescription>
              {badgeStats?.totalEarned || 0} badges otorgados en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {badgeStats?.byType && Object.entries(badgeStats.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{getBadgeTypeLabel(type)}</span>
                  <Badge className={getBadgeColor(type)}>{count as number}</Badge>
                </div>
              ))}
              {(!badgeStats?.byType || Object.keys(badgeStats.byType).length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No se han otorgado badges aún
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
