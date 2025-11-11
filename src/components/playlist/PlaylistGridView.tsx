import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Video, Trash2, GripVertical, CheckSquare, Square } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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

interface PlaylistGridViewProps {
  item: PlaylistItem;
  onRemove: (item: PlaylistItem) => void;
  onClick: (id: string) => void;
  formatDuration: (seconds: number | null) => string;
  editMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const PlaylistGridView = ({ item, onRemove, onClick, formatDuration, editMode, isSelected, onToggleSelect }: PlaylistGridViewProps) => {
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
      className={`group overflow-hidden border-border bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Thumbnail */}
      <div 
        className="relative overflow-hidden bg-secondary/20 cursor-pointer"
        onClick={() => editMode && onToggleSelect ? onToggleSelect(item.id) : onClick(item.content.id)}
      >
        <AspectRatio ratio={16 / 9}>
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
        </AspectRatio>

        {/* Drag Handle or Selection Checkbox */}
        {editMode && onToggleSelect ? (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 left-2 bg-background/80 hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(item.id);
            }}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        )}

        {/* Remove Button */}
        {!editMode && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/80 hover:bg-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {/* Duration Badge */}
        {item.content.duration && (
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-none">
            {formatDuration(item.content.duration)}
          </Badge>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Play className="w-12 h-12 text-white" fill="white" />
        </div>
      </div>

      {/* Content Info */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
          {item.content.title}
        </h3>
        
        {item.content.band_name && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {item.content.band_name}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
