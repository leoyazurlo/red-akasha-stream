import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Eye, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContentWithCreator } from "@/hooks/useContentByCreatorProfile";

const countryFlags: Record<string, string> = {
  "Argentina": "🇦🇷",
  "Bolivia": "🇧🇴",
  "Brasil": "🇧🇷",
  "Chile": "🇨🇱",
  "Colombia": "🇨🇴",
  "Costa Rica": "🇨🇷",
  "Cuba": "🇨🇺",
  "Ecuador": "🇪🇨",
  "El Salvador": "🇸🇻",
  "Guatemala": "🇬🇹",
  "Honduras": "🇭🇳",
  "México": "🇲🇽",
  "Nicaragua": "🇳🇮",
  "Panamá": "🇵🇦",
  "Paraguay": "🇵🇾",
  "Perú": "🇵🇪",
  "República Dominicana": "🇩🇴",
  "Uruguay": "🇺🇾",
  "Venezuela": "🇻🇪",
  "España": "🇪🇸",
  "Estados Unidos": "🇺🇸",
};

interface ContentCardProps {
  content: ContentWithCreator;
  categoryLabel: string;
  index: number;
}

export const ContentCard = ({ content, categoryLabel, index }: ContentCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/video/${content.id}`);
  };

  return (
    <Card 
      className="group overflow-hidden cursor-pointer transition-all duration-300 shadow-[0_0_25px_hsl(180_100%_50%/0.4),0_0_50px_hsl(180_100%_50%/0.2)] hover:shadow-[0_0_35px_hsl(180_100%_50%/0.6),0_0_70px_hsl(180_100%_50%/0.3)] hover:scale-[1.02] animate-fade-in bg-card/80 backdrop-blur-sm border-cyan-400"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {content.thumbnail_url ? (
          <img
            src={content.thumbnail_url}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Play className="w-12 h-12 text-primary/50" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Category badge */}
        <Badge className="absolute top-2 left-2 bg-background/80 text-foreground backdrop-blur-sm">
          {categoryLabel}
        </Badge>

        {/* Country flag */}
        {content.creator_country && countryFlags[content.creator_country] && (
          <div className="absolute bottom-2 right-2 text-2xl drop-shadow-lg" title={content.creator_country}>
            {countryFlags[content.creator_country]}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
          {content.title}
        </h3>

        {/* Creator info */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-6 h-6">
            <AvatarImage src={content.creator_avatar || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {content.creator_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">
            {content.creator_name}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{content.views_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            <span>{content.likes_count.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
