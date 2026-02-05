 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Progress } from "@/components/ui/progress";
 import { Separator } from "@/components/ui/separator";
 import { useUserBadges, useUserStats } from "@/hooks/useUserBadges";
 import { useFollow } from "@/hooks/useFollow";
 import { FollowStats } from "@/components/profile/FollowStats";
 import { FollowingActivity } from "@/components/profile/FollowingActivity";
 import { 
   Loader2, 
   Award, 
   MessageSquare, 
   Trophy,
   Calendar,
   TrendingUp,
   Activity
 } from "lucide-react";
 import * as LucideIcons from "lucide-react";
 import { LucideIcon } from "lucide-react";
 import { formatDistanceToNow } from "date-fns";
 import { es } from "date-fns/locale";
 
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
 
 interface ForumActivitySectionProps {
   userId: string;
 }
 
 export const ForumActivitySection = ({ userId }: ForumActivitySectionProps) => {
   // Fetch user profile from profiles table (auth user)
   const { data: profile, isLoading: profileLoading } = useQuery({
     queryKey: ["user-forum-profile", userId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("profiles")
         .select("*")
         .eq("id", userId)
         .single();
 
       if (error) throw error;
       return data;
     },
     enabled: !!userId,
   });
 
   const { data: userBadges, isLoading: badgesLoading } = useUserBadges(userId);
   const { data: stats, isLoading: statsLoading } = useUserStats(userId);
   const { followersCount, followingCount } = useFollow(userId);
 
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
 
     return progressList.sort((a, b) => b.progress - a.progress);
   };
 
   const badgeProgress = calculateBadgeProgress();
   const nextBadges = badgeProgress.slice(0, 3);
 
   const isLoading = profileLoading || badgesLoading || statsLoading;
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center h-48">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
     <div className="space-y-6 mt-8">
       {/* Section Title */}
       <div className="flex items-center gap-3 mb-6">
         <Activity className="h-6 w-6 text-primary" />
         <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
           Datos de Movimientos
         </h2>
       </div>
 
       {/* Profile Header Summary */}
       {profile && (
         <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
           <CardContent className="p-6">
             <div className="flex flex-col sm:flex-row items-center gap-4">
               <Avatar className="h-20 w-20 border-4 border-primary/20">
                 <AvatarImage src={profile.avatar_url || undefined} />
                 <AvatarFallback className="text-2xl">
                   {profile.username?.[0]?.toUpperCase() || profile.full_name?.[0]?.toUpperCase() || "U"}
                 </AvatarFallback>
               </Avatar>
               <div className="flex-1 text-center sm:text-left">
                 <h3 className="text-xl font-bold">
                   {profile.username || profile.full_name || "Usuario"}
                 </h3>
                 <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground justify-center sm:justify-start mt-2">
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
       )}
 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left Column - Stats */}
         <div className="space-y-6">
           {/* Follow Stats */}
           <FollowStats 
             followersCount={followersCount}
             followingCount={followingCount}
           />
 
           {/* Activity Stats */}
           <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
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
           <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
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
           <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
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
                       <Card key={userBadge.id} className="border-2 border-primary/20">
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
                     Aún no has obtenido ningún badge. ¡Participa en el foro para ganar tus primeros logros!
                   </p>
                 </div>
               )}
             </CardContent>
           </Card>
 
           {/* Progress towards next badges */}
           {nextBadges.length > 0 && (
             <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
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
 
           {/* Following Activity */}
           <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
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
         </div>
       </div>
     </div>
   );
 };