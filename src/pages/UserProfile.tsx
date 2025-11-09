import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ShareProfile } from "@/components/profile/ShareProfile";
import { ExportAchievements } from "@/components/profile/ExportAchievements";
import { FollowButton } from "@/components/profile/FollowButton";
import { FollowStats } from "@/components/profile/FollowStats";
import { FollowingActivity } from "@/components/profile/FollowingActivity";
import { useFollow } from "@/hooks/useFollow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useUserBadges, useUserStats } from "@/hooks/useUserBadges";
import { 
  Loader2, 
  Award, 
  MessageSquare, 
  MessageCircle, 
  ThumbsUp, 
  Trophy,
  ArrowLeft,
  Calendar,
  TrendingUp
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";

const getBadgeColor = (badgeType: string) => {
  switch (badgeType) {
    case "bronze":
      return "bg-amber-700/20 text-amber-300 border-amber-700/50";
    case "silver":
      return "bg-slate-400/20 text-slate-200 border-slate-400/50";
    case "gold":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
    case "special":
      return "bg-purple-500/20 text-purple-300 border-purple-500/50";
    case "merit":
      return "bg-green-500/20 text-green-300 border-green-500/50";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getBadgeTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    bronze: "Bronce",
    silver: "Plata",
    gold: "Oro",
    special: "Especial",
    merit: "Mérito",
  };
  return labels[type] || type;
};

interface BadgeProgress {
  badge: {
    id: string;
    name: string;
    description: string;
    badge_type: string;
    icon: string;
    requirement_description: string;
  };
  current: number;
  required: number;
  progress: number;
}

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwnProfile = user?.id === id;

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: userBadges, isLoading: badgesLoading } = useUserBadges(id);
  const { data: stats, isLoading: statsLoading } = useUserStats(id);
  const { followersCount, followingCount } = useFollow(id || null);

  // Fetch all available badges
  const { data: allBadges } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_badges")
        .select("*")
        .order("badge_type")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Calculate progress towards unearned badges
  const calculateBadgeProgress = (): BadgeProgress[] => {
    if (!allBadges || !stats || !userBadges) return [];

    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge?.id).filter(Boolean));
    const unearnedBadges = allBadges.filter(badge => !earnedBadgeIds.has(badge.id));

    const progressList: BadgeProgress[] = [];

    unearnedBadges.forEach(badge => {
      let current = 0;
      let required = 0;

      // Map badge requirements to current stats
      switch (badge.name) {
        case "Primer Hilo":
          current = Math.min(stats.threads, 1);
          required = 1;
          break;
        case "Primer Post":
          current = Math.min(stats.posts, 1);
          required = 1;
          break;
        case "Conversador":
          current = stats.threads;
          required = 10;
          break;
        case "Colaborador Activo":
          current = stats.posts;
          required = 50;
          break;
        case "Popular":
          current = stats.positiveVotes;
          required = 25;
          break;
        case "Experto del Foro":
          current = stats.threads;
          required = 50;
          break;
        case "Súper Colaborador":
          current = stats.posts;
          required = 200;
          break;
        case "Muy Popular":
          current = stats.positiveVotes;
          required = 100;
          break;
        case "Mentor":
          current = stats.bestAnswers;
          required = 10;
          break;
        case "Constructivo":
          // This would require querying votes given, skip for now
          current = 0;
          required = 100;
          break;
        default:
          return;
      }

      if (required > 0) {
        progressList.push({
          badge,
          current,
          required,
          progress: Math.min((current / required) * 100, 100),
        });
      }
    });

    // Sort by progress (closest to completion first)
    return progressList.sort((a, b) => b.progress - a.progress);
  };

  const badgeProgress = calculateBadgeProgress();
  const nextBadges = badgeProgress.slice(0, 5); // Show top 5 closest badges

  if (profileLoading || badgesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        <CosmicBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background relative">
        <CosmicBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Usuario no encontrado</h1>
            <Button onClick={() => navigate("/foro")}>Volver al Foro</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const badgesByType = {
    bronze: userBadges?.filter(b => b.badge?.badge_type === "bronze") || [],
    silver: userBadges?.filter(b => b.badge?.badge_type === "silver") || [],
    gold: userBadges?.filter(b => b.badge?.badge_type === "gold") || [],
    special: userBadges?.filter(b => b.badge?.badge_type === "special") || [],
    merit: userBadges?.filter(b => b.badge?.badge_type === "merit") || [],
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CosmicBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          {/* Profile Header */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl">
                    {profile.username?.[0]?.toUpperCase() || profile.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 mb-2">
                    <h1 className="text-3xl font-bold">
                      {profile.username || profile.full_name || "Usuario"}
                    </h1>
                    <div className="flex gap-2">
                      <FollowButton userId={id!} currentUserId={user?.id} />
                      <ShareProfile 
                        userId={id!} 
                        userName={profile.username || profile.full_name || "Usuario"} 
                      />
                      <ExportAchievements
                        userName={profile.username || profile.full_name || "Usuario"}
                        stats={stats || { threads: 0, posts: 0, positiveVotes: 0, bestAnswers: 0 }}
                        badges={{
                          bronze: badgesByType.bronze.length,
                          silver: badgesByType.silver.length,
                          gold: badgesByType.gold.length,
                          special: badgesByType.special.length,
                          merit: badgesByType.merit.length,
                        }}
                        reputationPoints={profile.reputation_points || 0}
                      />
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground justify-center md:justify-start">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Miembro desde {formatDistanceToNow(new Date(profile.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span>{userBadges?.length || 0} badges obtenidos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>{profile.reputation_points || 0} puntos de reputación</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats */}
            <div className="space-y-6">
              {/* Follow Stats */}
              <FollowStats 
                followersCount={followersCount}
                followingCount={followingCount}
              />
              {/* Activity Stats */}
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Actividad en el Foro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Hilos creados</span>
                      <span className="text-2xl font-bold">{stats?.threads || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Posts escritos</span>
                      <span className="text-2xl font-bold">{stats?.posts || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Votos recibidos</span>
                      <span className="text-2xl font-bold text-green-500">{stats?.positiveVotes || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Mejores respuestas</span>
                      <span className="text-2xl font-bold text-yellow-500">{stats?.bestAnswers || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badge Summary */}
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Resumen de Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(badgesByType).map(([type, badges]) => {
                      if (badges.length === 0) return null;
                      return (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{getBadgeTypeLabel(type)}</span>
                          <Badge className={getBadgeColor(type)}>
                            {badges.length}
                          </Badge>
                        </div>
                      );
                    })}
                    {userBadges?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aún no has obtenido ningún badge
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Badges and Progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* Earned Badges */}
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle>Badges Obtenidos</CardTitle>
                  <CardDescription>
                    {userBadges?.length || 0} de {allBadges?.length || 0} badges totales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userBadges && userBadges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {userBadges.map((userBadge) => {
                        if (!userBadge.badge) return null;
                        const badge = userBadge.badge;
                        const IconComponent = (LucideIcons[badge.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Award;

                        return (
                          <Card key={userBadge.id} className="border-2">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-3">
                                <Badge
                                  variant="outline"
                                  className={`${getBadgeColor(badge.badge_type)} h-12 w-12 flex items-center justify-center flex-shrink-0`}
                                >
                                  <IconComponent className="h-6 w-6" />
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {badge.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Obtenido {formatDistanceToNow(new Date(userBadge.earned_at), {
                                      addSuffix: true,
                                      locale: es,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        {isOwnProfile 
                          ? "Aún no has obtenido ningún badge. ¡Participa en el foro para ganar tus primeros logros!"
                          : "Este usuario aún no ha obtenido ningún badge."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress towards next badges */}
              {nextBadges.length > 0 && (
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle>Próximos Logros</CardTitle>
                    <CardDescription>
                      Tu progreso hacia nuevos badges
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {nextBadges.map((progress) => {
                      const IconComponent = (LucideIcons[progress.badge.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Award;

                      return (
                        <div key={progress.badge.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={`${getBadgeColor(progress.badge.badge_type)} h-10 w-10 flex items-center justify-center`}
                              >
                                <IconComponent className="h-5 w-5" />
                              </Badge>
                              <div>
                                <h4 className="font-semibold text-sm">{progress.badge.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {progress.badge.requirement_description}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold">
                              {progress.current}/{progress.required}
                            </span>
                          </div>
                          <Progress value={progress.progress} className="h-2" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Following Activity - Only show on own profile */}
              {isOwnProfile && (
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle>Actividad de tus Seguidos</CardTitle>
                    <CardDescription>
                      Últimas publicaciones de usuarios que sigues
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FollowingActivity />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
