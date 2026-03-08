import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIES = [
  { value: "all", label: "Todo" },
  { value: "podcast", label: "Podcast" },
  { value: "musica", label: "Música" },
  { value: "audio_en_vivo", label: "Audio en Vivo" },
  { value: "remix", label: "Remix" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recientes" },
  { value: "popular", label: "Populares" },
  { value: "alphabetical", label: "A-Z" },
  { value: "duration", label: "Duración" },
];

interface AudioSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const AudioSearchFilters = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: AudioSearchFiltersProps) => {
  return (
    <div className="px-6 py-3 flex flex-wrap items-center gap-3 border-b border-border/30">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por título o artista..."
          className="pl-9 h-9 bg-secondary/50 border-none text-sm"
        />
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="text-xs">
              {SORT_OPTIONS.find((s) => s.value === sortBy)?.label || "Ordenar"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SORT_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={cn(sortBy === opt.value && "font-semibold text-primary")}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
