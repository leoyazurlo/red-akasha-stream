import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, X, Play, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onMetadataExtracted?: (metadata: { thumbnail: string; width: number; height: number; size: number; duration: number }) => void;
  required?: boolean;
  description?: string;
}

// Helper para detectar plataformas de video
const getVideoPlatform = (url: string): { platform: string; embedUrl: string; thumbnail: string } | null => {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }
      if (videoId) {
        return {
          platform: 'YouTube',
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
      }
    }
    
    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (videoId) {
        return {
          platform: 'Vimeo',
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          thumbnail: ''
        };
      }
    }
    
    // Dailymotion
    if (urlObj.hostname.includes('dailymotion.com') || urlObj.hostname.includes('dai.ly')) {
      let videoId = '';
      if (urlObj.hostname.includes('dai.ly')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.pathname.split('/video/')[1]?.split('_')[0] || '';
      }
      if (videoId) {
        return {
          platform: 'Dailymotion',
          embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
          thumbnail: `https://www.dailymotion.com/thumbnail/video/${videoId}`
        };
      }
    }
    
    // URL directa de video (mp4, webm, etc.)
    if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      return {
        platform: 'Direct',
        embedUrl: url,
        thumbnail: ''
      };
    }
    
    return null;
  } catch {
    return null;
  }
};

const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

export const VideoUpload = ({ label, value, onChange, onMetadataExtracted, required, description }: VideoUploadProps) => {
  const { toast } = useToast();
  const [inputUrl, setInputUrl] = useState(value);
  const [videoInfo, setVideoInfo] = useState<{ platform: string; embedUrl: string; thumbnail: string } | null>(
    value ? getVideoPlatform(value) : null
  );

  const handleUrlChange = (url: string) => {
    setInputUrl(url);
  };

  const handleAddUrl = () => {
    if (!inputUrl.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un enlace de video",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(inputUrl)) {
      toast({
        title: "Error",
        description: "El enlace no es válido",
        variant: "destructive",
      });
      return;
    }

    const info = getVideoPlatform(inputUrl);
    if (!info) {
      toast({
        title: "Advertencia",
        description: "No se reconoció la plataforma, pero el enlace se guardará",
      });
    }

    setVideoInfo(info);
    onChange(inputUrl);

    // Notificar metadatos al componente padre si hay thumbnail
    if (info?.thumbnail && onMetadataExtracted) {
      onMetadataExtracted({
        thumbnail: info.thumbnail,
        width: 1920,
        height: 1080,
        size: 0,
        duration: 0
      });
    }

    toast({
      title: "¡Enlace agregado!",
      description: info ? `Video de ${info.platform} detectado` : "Enlace guardado correctamente",
    });
  };

  const handleRemove = () => {
    setInputUrl("");
    setVideoInfo(null);
    onChange("");
  };

  return (
    <div className="space-y-3">
      <Label>
        {label} {required && "*"}
      </Label>
      
      {/* Información de plataformas soportadas */}
      <Alert className="border-primary/20 bg-primary/5">
        <Link className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs">
          <strong>Plataformas:</strong> YouTube, Vimeo, Dailymotion o enlace directo (mp4, webm)
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col gap-4">
        {/* Preview del video */}
        {value && videoInfo && (
          <div className="relative w-full max-w-md rounded-lg overflow-hidden border-2 border-border">
            {videoInfo.platform === 'Direct' ? (
              <video 
                src={videoInfo.embedUrl} 
                controls
                className="w-full h-auto"
              />
            ) : (
              <div className="relative aspect-video">
                {videoInfo.thumbnail ? (
                  <>
                    <img 
                      src={videoInfo.thumbnail} 
                      alt="Miniatura del video"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="w-16 h-16 text-white opacity-80" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <span className="text-sm text-muted-foreground">{videoInfo.platform}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Badge de plataforma */}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {videoInfo.platform}
            </div>
          </div>
        )}

        {/* Input de URL */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              value={inputUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddUrl}
            >
              <Link className="mr-2 h-4 w-4" />
              {value ? "Cambiar" : "Agregar"}
            </Button>
          </div>
          
          {value && (
            <p className="text-xs text-muted-foreground truncate">
              Enlace actual: {value}
            </p>
          )}
        </div>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
