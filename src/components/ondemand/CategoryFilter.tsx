import { Video, Film, Music2, Mic2, PlayCircle, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface CategoryFilterProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  counts: {
    all: number;
    video_musical_vivo: number;
    video_clip: number;
    podcast: number;
    corto: number;
    documental: number;
    pelicula: number;
  };
}

const categories = [
  { value: "all", icon: PlayCircle, label: "Todos" },
  { value: "video_musical_vivo", icon: Music2, label: "Video Musical en Vivo" },
  { value: "video_clip", icon: Video, label: "Video Clip" },
  { value: "podcast", icon: Mic2, label: "Podcast" },
  { value: "documental", icon: Clapperboard, label: "Documental" },
  { value: "corto", icon: Film, label: "Cortos" },
  { value: "pelicula", icon: Film, label: "Películas" },
];

export const CategoryFilter = ({ selectedType, onTypeChange, counts }: CategoryFilterProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {categories.map((category) => {
        const Icon = category.icon;
        const count = counts[category.value as keyof typeof counts] || 0;
        const isSelected = selectedType === category.value;
        
        return (
          <button
            key={category.value}
            onClick={() => onTypeChange(category.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300",
              "border text-sm font-medium",
              isSelected 
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/60 shadow-[0_0_12px_hsl(180_100%_50%/0.3)]" 
                : "bg-card/50 text-muted-foreground border-border hover:border-cyan-500/30 hover:text-foreground hover:bg-card"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{category.label}</span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full min-w-[1.5rem] text-center",
              isSelected 
                ? "bg-cyan-500/30 text-cyan-300" 
                : "bg-muted text-muted-foreground"
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
