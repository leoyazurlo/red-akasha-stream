import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Video, Loader2, AlertCircle } from "lucide-react";
import { validateFile, formatFileSize } from "@/lib/storage-validation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File) => void;
  onMetadataExtracted?: (metadata: { thumbnail: string; width: number; height: number; size: number; duration: number }) => void;
  required?: boolean;
  description?: string;
   uploadImmediately?: boolean;
}

export const VideoUpload = ({ label, value, onChange, onFileSelect, onMetadataExtracted, required, description, uploadImmediately = true }: VideoUploadProps) => {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(value || null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
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
    setUploadProgress(0);
    setVideoPlaybackError(false);
    setUploadedFileName(file.name);
    try {
      if (onFileSelect) {
        onFileSelect(file);
      }

      // If uploadImmediately is true, upload to storage right away
      if (uploadImmediately) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Debes iniciar sesión para subir videos");
        }

        toast({
          title: "Subiendo video...",
          description: "Este proceso puede tardar unos minutos dependiendo del tamaño del archivo.",
        });

        // Create unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const fileName = `${user.id}/${timestamp}_${random}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('content-videos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('content-videos')
          .getPublicUrl(data.path);

        setPreview(publicUrl);
        onChange(publicUrl);

        // Save to media library
        await supabase.from('user_media_library').insert({
          user_id: user.id,
          media_type: 'video',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          tags: ['video'],
          folder: 'Videos'
        });

        toast({
          title: "¡Video subido!",
          description: "El video se ha subido correctamente",
        });
      } else {
        // Just create local preview without uploading
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        onChange(objectUrl);
      }

      // Extract metadata from video (non-blocking)
      try {
        const videoEl = document.createElement('video');
        videoEl.preload = 'metadata';
        const metadataUrl = URL.createObjectURL(file);
        videoEl.src = metadataUrl;

        const metadataTimeout = setTimeout(() => {
          URL.revokeObjectURL(metadataUrl);
          setLoading(false);
        }, 10000);

        videoEl.onloadedmetadata = () => {
          const metadata = {
            thumbnail: '',
            width: videoEl.videoWidth,
            height: videoEl.videoHeight,
            size: file.size,
            duration: videoEl.duration
          };

          // Seek to 25% of duration to avoid black intro frames
          const seekTo = Math.max(1, videoEl.duration * 0.25);
          videoEl.currentTime = seekTo;
          videoEl.onseeked = () => {
            clearTimeout(metadataTimeout);
            try {
              const canvas = document.createElement('canvas');
              canvas.width = videoEl.videoWidth;
              canvas.height = videoEl.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(videoEl, 0, 0);
                metadata.thumbnail = canvas.toDataURL('image/jpeg', 0.8);
              }
            } catch (_) { /* thumbnail generation failed, continue */ }
            
            if (onMetadataExtracted) {
              onMetadataExtracted(metadata);
            }
            
            URL.revokeObjectURL(metadataUrl);
            setLoading(false);
          };
        };

        videoEl.onerror = () => {
          clearTimeout(metadataTimeout);
          URL.revokeObjectURL(metadataUrl);
          setLoading(false);
          // Don't show error - video uploaded fine, just metadata extraction failed
        };
      } catch (_) {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo cargar el video",
        variant: "destructive",
      });
    }
  };

  const handleRemove = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setVideoPlaybackError(false);
    setUploadedFileName("");
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
      
      {/* Upload info */}
      <Alert className="border-primary/20 bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs">
          <strong>Formatos aceptados:</strong> MP4, WebM, MOV, MKV (máx. 1GB).{' '}
          <span className="text-muted-foreground">Para garantizar la reproducción en todos los navegadores y dispositivos, te recomendamos subir tus videos en formato <strong className="text-foreground">MP4</strong> o <strong className="text-foreground">WebM</strong>. Los archivos MOV y MKV se almacenarán correctamente, pero algunos navegadores podrían no reproducirlos de forma nativa.</span>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4">
        {preview ? (
          <div className="relative w-full max-w-md rounded-lg overflow-hidden border-2 border-border">
            {videoPlaybackError ? (
              <div className="flex flex-col items-center justify-center w-full h-40 bg-muted/30">
                <Video className="w-10 h-10 text-primary mb-2" />
                <p className="text-sm text-foreground font-medium">Video subido correctamente</p>
                <p className="text-xs text-muted-foreground mt-1 px-4 text-center truncate max-w-full">{uploadedFileName}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={preview}
                controls
                playsInline
                className="w-full h-auto max-h-64 object-contain bg-black"
                onError={() => setVideoPlaybackError(true)}
              />
            )}
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
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Subiendo video...</p>
              </div>
            ) : (
              <>
                <Video className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Haz clic para seleccionar un video</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV, MKV (máx. 1GB)</p>
              </>
            )}
          </div>
        )}

        <Input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv,.avi"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
