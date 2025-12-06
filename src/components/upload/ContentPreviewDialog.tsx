import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Music, ImageIcon, Clock, MonitorPlay, HardDrive } from "lucide-react";

interface ContentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    content_type: string;
    title: string;
    description: string;
    thumbnail_url: string;
    custom_thumbnail_url: string;
    photo_url: string;
    video_url: string;
    audio_url: string;
    video_width: number;
    video_height: number;
    video_duration_seconds: number;
    audio_duration_seconds: number;
    file_size: number;
  };
  loading: boolean;
  onPublish: () => void;
  getContentTypeLabel: (type: string) => string;
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'N/A';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const ContentPreviewDialog = ({
  open,
  onOpenChange,
  formData,
  loading,
  onPublish,
  getContentTypeLabel,
}: ContentPreviewDialogProps) => {
  const { t } = useTranslation();

  const thumbnailUrl = formData.custom_thumbnail_url || formData.thumbnail_url || formData.photo_url;
  const duration = formData.video_duration_seconds || formData.audio_duration_seconds;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('upload.previewTitle')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('upload.previewDesc')}
          </p>
          
          <Card className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {formData.video_url && <Play className="w-16 h-16 text-muted-foreground" />}
                  {formData.audio_url && !formData.video_url && <Music className="w-16 h-16 text-muted-foreground" />}
                  {formData.photo_url && !formData.video_url && !formData.audio_url && <ImageIcon className="w-16 h-16 text-muted-foreground" />}
                </div>
              )}
              
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="backdrop-blur-sm">
                  {getContentTypeLabel(formData.content_type)}
                </Badge>
              </div>

              <div className="absolute top-2 right-2">
                <Badge variant="default" className="backdrop-blur-sm">
                  {t('upload.pending')}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1 text-foreground">
                  {formData.title || t('upload.noTitle')}
                </h3>
                {formData.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {formData.description}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                {formData.video_width > 0 && formData.video_height > 0 && (
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="w-4 h-4" />
                    <span>{formData.video_width}x{formData.video_height}</span>
                  </div>
                )}
                
                {duration > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(duration)}</span>
                  </div>
                )}
                
                {formData.file_size > 0 && (
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    <span>{formatFileSize(formData.file_size)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  disabled
                >
                  {formData.video_url && <Play className="w-4 h-4 mr-2" />}
                  {formData.audio_url && !formData.video_url && <Music className="w-4 h-4 mr-2" />}
                  {formData.photo_url && !formData.video_url && !formData.audio_url && <ImageIcon className="w-4 h-4 mr-2" />}
                  Ver
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t('upload.continueEditing')}
            </Button>
            <Button 
              className="flex-1"
              onClick={onPublish}
              disabled={loading}
            >
              {t('upload.publishNow')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
