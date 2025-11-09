import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStats, useUserBadges } from "@/hooks/useUserBadges";
import { MessageSquare, MessageCircle, ThumbsUp, Award, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserStatsCardProps {
  userId: string;
  userName?: string;
}

export const UserStatsCard = ({ userId, userName }: UserStatsCardProps) => {
  const { data: stats, isLoading: statsLoading } = useUserStats(userId);
  const { data: badges, isLoading: badgesLoading } = useUserBadges(userId);

  if (statsLoading || badgesLoading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  const badgesByType = {
    bronze: badges?.filter(b => b.badge?.badge_type === "bronze").length || 0,
    silver: badges?.filter(b => b.badge?.badge_type === "silver").length || 0,
    gold: badges?.filter(b => b.badge?.badge_type === "gold").length || 0,
    special: badges?.filter(b => b.badge?.badge_type === "special").length || 0,
    merit: badges?.filter(b => b.badge?.badge_type === "merit").length || 0,
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Estadísticas {userName && `de ${userName}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
            <MessageSquare className="h-4 w-4 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.threads || 0}</p>
              <p className="text-xs text-muted-foreground">Hilos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
            <MessageCircle className="h-4 w-4 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.posts || 0}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
            <ThumbsUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.positiveVotes || 0}</p>
              <p className="text-xs text-muted-foreground">Votos +</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
            <Award className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.bestAnswers || 0}</p>
              <p className="text-xs text-muted-foreground">Mejores</p>
            </div>
          </div>
        </div>

        {(badges?.length || 0) > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-sm font-semibold mb-2">Insignias Obtenidas</p>
            <div className="grid grid-cols-5 gap-2 text-center">
              {badgesByType.bronze > 0 && (
                <div className="p-2 rounded bg-amber-700/10">
                  <p className="text-lg font-bold text-amber-300">{badgesByType.bronze}</p>
                  <p className="text-[10px] text-amber-300/70">Bronce</p>
                </div>
              )}
              {badgesByType.silver > 0 && (
                <div className="p-2 rounded bg-slate-400/10">
                  <p className="text-lg font-bold text-slate-200">{badgesByType.silver}</p>
                  <p className="text-[10px] text-slate-200/70">Plata</p>
                </div>
              )}
              {badgesByType.gold > 0 && (
                <div className="p-2 rounded bg-yellow-500/10">
                  <p className="text-lg font-bold text-yellow-300">{badgesByType.gold}</p>
                  <p className="text-[10px] text-yellow-300/70">Oro</p>
                </div>
              )}
              {badgesByType.special > 0 && (
                <div className="p-2 rounded bg-purple-500/10">
                  <p className="text-lg font-bold text-purple-300">{badgesByType.special}</p>
                  <p className="text-[10px] text-purple-300/70">Especial</p>
                </div>
              )}
              {badgesByType.merit > 0 && (
                <div className="p-2 rounded bg-green-500/10">
                  <p className="text-lg font-bold text-green-300">{badgesByType.merit}</p>
                  <p className="text-[10px] text-green-300/70">Mérito</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
