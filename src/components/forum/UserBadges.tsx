import { Badge } from "@/components/ui/badge";
import { useUserBadges } from "@/hooks/useUserBadges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface UserBadgesProps {
  userId: string;
  limit?: number;
  showCount?: boolean;
}

const getBadgeColor = (badgeType: string) => {
  switch (badgeType) {
    case "bronze":
      return "bg-amber-700/20 text-amber-300 border-amber-700/50 hover:bg-amber-700/30";
    case "silver":
      return "bg-slate-400/20 text-slate-200 border-slate-400/50 hover:bg-slate-400/30";
    case "gold":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30";
    case "special":
      return "bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30";
    case "merit":
      return "bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const UserBadges = ({ userId, limit, showCount = false }: UserBadgesProps) => {
  const { data: userBadges, isLoading } = useUserBadges(userId);

  if (isLoading) {
    return (
      <div className="flex gap-1">
        <div className="h-6 w-6 bg-muted/50 rounded animate-pulse" />
        <div className="h-6 w-6 bg-muted/50 rounded animate-pulse" />
      </div>
    );
  }

  if (!userBadges || userBadges.length === 0) {
    return null;
  }

  const displayBadges = limit ? userBadges.slice(0, limit) : userBadges;
  const remainingCount = userBadges.length - displayBadges.length;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 flex-wrap">
        {displayBadges.map((userBadge) => {
          if (!userBadge.badge) return null;
          
          const badge = userBadge.badge;
          const IconComponent = (LucideIcons[badge.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Award;

          return (
            <Tooltip key={userBadge.id}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`cursor-help transition-all ${getBadgeColor(badge.badge_type)} h-6 px-2`}
                >
                  <IconComponent className="h-3 w-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  {badge.requirement_description && (
                    <p className="text-xs text-muted-foreground italic">
                      Requisito: {badge.requirement_description}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {showCount && remainingCount > 0 && (
          <Badge variant="outline" className="h-6 px-2 text-xs">
            +{remainingCount}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
};
