import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Video, Loader2 } from "lucide-react";
import { validateFile, formatFileSize } from "@/lib/storage-validation";

interface VideoUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File) => void;
  onMetadataExtracted?: (metadata: { thumbnail: string; width: number; height: number; size: number; duration: number }) => void;
  required?: boolean;
  description?: string;
}

export const VideoUpload = ({ label, value, onChange, onFileSelect, onMetadataExtracted, required, description }: VideoUploadProps) => {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(value || null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, 'video');
    if (!validation.valid) {
      toast({
        title: "Archivo no válido",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      
      if (onFileSelect) {
        onFileSelect(file);
      }

      // Extract metadata from video
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = objectUrl;

      video.onloadedmetadata = () => {
        const metadata = {
          thumbnail: '',
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          duration: video.duration
        };

        // Generate thumbnail from first frame
        video.currentTime = 1;
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            metadata.thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          }
          
          if (onMetadataExtracted) {
            onMetadataExtracted(metadata);
          }
          
          setLoading(false);
        };
      };

      video.onerror = () => {
        setLoading(false);
        toast({
          title: "Error",
          description: "No se pudo procesar el video",
          variant: "destructive",
        });
      };

      onChange(objectUrl);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: "No se pudo cargar el video",
        variant: "destructive",
      });
    }
  };

  const handleRemove = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label>
        {label} {required && "*"}
      </Label>
      
      <div className="flex flex-col gap-4">
        {preview ? (
          <div className="relative w-full max-w-md rounded-lg overflow-hidden border-2 border-border">
            <video
              ref={videoRef}
              src={preview}
              controls
              className="w-full h-auto max-h-64 object-contain bg-black"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full max-w-md h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
          >
            {loading ? (
              <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Video className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Haz clic para seleccionar un video</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV (máx. 500MB)</p>
              </>
            )}
          </div>
        )}

        <Input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
