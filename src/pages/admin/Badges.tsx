import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Award, Search } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

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

export default function Badges() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: badges, isLoading } = useQuery({
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

  const { data: badgeStats, isLoading: statsLoading } = useQuery({
    queryKey: ["badge-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("badge_id");

      if (error) throw error;

      // Count badges by badge_id
      const counts: Record<string, number> = {};
      data.forEach((userBadge) => {
        counts[userBadge.badge_id] = (counts[userBadge.badge_id] || 0) + 1;
      });

      return counts;
    },
  });

  const filteredBadges = badges?.filter((badge) =>
    badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const badgesByType = {
    bronze: filteredBadges?.filter((b) => b.badge_type === "bronze") || [],
    silver: filteredBadges?.filter((b) => b.badge_type === "silver") || [],
    gold: filteredBadges?.filter((b) => b.badge_type === "gold") || [],
    special: filteredBadges?.filter((b) => b.badge_type === "special") || [],
    merit: filteredBadges?.filter((b) => b.badge_type === "merit") || [],
  };

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Badges</h1>
        <p className="text-muted-foreground">
          Sistema de insignias para reconocer la participación activa en el foro
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar badges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{badgesByType.bronze.length}</p>
              <p className="text-xs text-muted-foreground">Badges Bronce</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-2xl font-bold">{badgesByType.silver.length}</p>
              <p className="text-xs text-muted-foreground">Badges Plata</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{badgesByType.gold.length}</p>
              <p className="text-xs text-muted-foreground">Badges Oro</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{badgesByType.special.length}</p>
              <p className="text-xs text-muted-foreground">Badges Especiales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{badgesByType.merit.length}</p>
              <p className="text-xs text-muted-foreground">Badges Mérito</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges by Type */}
      {Object.entries(badgesByType).map(([type, typeBadges]) => {
        if (typeBadges.length === 0) return null;

        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="capitalize">{getBadgeTypeLabel(type)}</CardTitle>
              <CardDescription>
                {typeBadges.length} badge{typeBadges.length !== 1 ? "s" : ""} en esta categoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeBadges.map((badge) => {
                  const IconComponent = (LucideIcons[badge.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Award;
                  const earnedCount = badgeStats?.[badge.id] || 0;

                  return (
                    <Card key={badge.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Badge
                            variant="outline"
                            className={`${getBadgeColor(badge.badge_type)} h-12 w-12 flex items-center justify-center`}
                          >
                            <IconComponent className="h-6 w-6" />
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                            <p className="text-xs text-muted-foreground mb-2">
                              {badge.description}
                            </p>
                            {badge.requirement_description && (
                              <p className="text-xs text-muted-foreground italic mb-2">
                                📋 {badge.requirement_description}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {earnedCount} {earnedCount === 1 ? "usuario" : "usuarios"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {filteredBadges?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No se encontraron badges</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
