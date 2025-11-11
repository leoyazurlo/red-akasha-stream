import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Video, Trash2, GripVertical, Clock } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlaylistItem {
  id: string;
  content_id: string;
  order_index: number;
  added_at: string;
  content: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    duration: number | null;
    band_name: string | null;
    content_type: string;
  };
}

interface PlaylistListViewProps {
  item: PlaylistItem;
  onRemove: (item: PlaylistItem) => void;
  onClick: (id: string) => void;
  formatDuration: (seconds: number | null) => string;
  index: number;
}

export const PlaylistListView = ({ item, onRemove, onClick, formatDuration, index }: PlaylistListViewProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getContentIcon = () => <Video className="w-5 h-5" />;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className="group overflow-hidden border-border bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all cursor-pointer"
      onClick={() => onClick(item.content.id)}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Drag Handle */}
        <Button
          size="icon"
          variant="ghost"
          className="cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5" />
        </Button>

        {/* Index Number */}
        <div className="text-muted-foreground font-mono text-sm w-8 shrink-0 text-center">
          {index + 1}
        </div>

        {/* Thumbnail */}
        <div className="relative w-32 h-20 shrink-0 overflow-hidden rounded-md bg-secondary/20">
          {item.content.thumbnail_url ? (
            <img
              src={item.content.thumbnail_url}
              alt={item.content.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/30">
              {getContentIcon()}
            </div>
          )}
          
          {/* Play Overlay on Thumbnail */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Play className="w-6 h-6 text-white" fill="white" />
          </div>
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base line-clamp-1 mb-1">
            {item.content.title}
          </h3>
          
          {item.content.band_name && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {item.content.band_name}
            </p>
          )}

          {item.content.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.content.description}
            </p>
          )}
        </div>

        {/* Duration */}
        {item.content.duration && (
          <div className="shrink-0 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatDuration(item.content.duration)}
          </div>
        )}

        {/* Remove Button */}
        <Button
          size="icon"
          variant="destructive"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
