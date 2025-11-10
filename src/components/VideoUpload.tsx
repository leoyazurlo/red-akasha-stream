import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Play, AlertCircle, FolderOpen } from "lucide-react";
import { validateFile, getFileRequirements } from "@/lib/storage-validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MediaLibrary } from "@/components/MediaLibrary";

interface VideoUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onMetadataExtracted?: (metadata: { thumbnail: string; width: number; height: number; size: number; duration: number }) => void;
  required?: boolean;
  description?: string;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
}

export const VideoUpload = ({ label, value, onChange, onMetadataExtracted, required, description }: VideoUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string>(value);
  const [thumbnail, setThumbnail] = useState<string>("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requirements = getFileRequirements('video');
  const [showLibrary, setShowLibrary] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const extractVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        video.currentTime = 1; // Extraer frame en el segundo 1
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailUrl);
        } else {
          reject(new Error('No se pudo crear el contexto del canvas'));
        }

        // Limpiar
        video.src = '';
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Error al cargar el video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const extractVideoMetadata = (file: File): Promise<VideoMetadata> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size
        };
        resolve(metadata);
        
        // Limpiar
        video.src = '';
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Error al cargar metadatos del video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, 'video');
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Extraer miniatura y metadatos del video
    try {
      const [thumbnailUrl, videoMetadata] = await Promise.all([
        extractVideoThumbnail(file),
        extractVideoMetadata(file)
      ]);
      setThumbnail(thumbnailUrl);
      setMetadata(videoMetadata);
      
      // Notificar metadatos al componente padre
      if (onMetadataExtracted) {
        onMetadataExtracted({
          thumbnail: thumbnailUrl,
          width: videoMetadata.width,
          height: videoMetadata.height,
          size: videoMetadata.size,
          duration: videoMetadata.duration
        });
      }
    } catch (error) {
      console.error('Error al extraer miniatura/metadatos:', error);
      // Continuar sin miniatura/metadatos si falla
    }

    setUploading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Debes iniciar sesión");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

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

      // Guardar en biblioteca con tags y carpeta
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from('user_media_library').insert({
          user_id: currentUser.id,
          media_type: 'video',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          thumbnail_url: thumbnail || null,
          width: metadata?.width || null,
          height: metadata?.height || null,
          duration_seconds: metadata?.duration || null,
          tags: ['video'], // Default tag
          folder: 'Videos'
        });
      }

      toast({
        title: "¡Video subido!",
        description: "El video se ha subido correctamente",
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Cancelado",
          description: "La carga del video fue cancelada",
        });
      } else {
        console.error('Error al subir video:', error);
        toast({
          title: "Error",
          description: error.message || "No se pudo subir el video",
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRemove = () => {
    setPreview("");
    setThumbnail("");
    setMetadata(null);
    setUploadProgress(0);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && "*"}
      </Label>
      
      {/* Información de requisitos */}
      <Alert className="border-primary/20 bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs">
          <strong>Formatos:</strong> {requirements.formats} • <strong>Tamaño máx:</strong> {requirements.maxSize}
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col gap-4">
        {preview && (
          <div className="relative w-full max-w-md rounded-lg overflow-hidden border-2 border-border">
            <video 
              src={preview} 
              controls
              className="w-full h-auto"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!preview && thumbnail && (
          <div className="space-y-3">
            <div className="relative w-full max-w-md rounded-lg overflow-hidden border-2 border-border">
              <img 
                src={thumbnail} 
                alt="Miniatura del video"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Play className="w-16 h-16 text-white opacity-80" />
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {metadata && (
              <div className="w-full max-w-md p-4 rounded-lg bg-muted border border-border">
                <h4 className="text-sm font-semibold mb-3 text-foreground">Información del video</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duración:</span>
                    <p className="font-medium text-foreground">{formatDuration(metadata.duration)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resolución:</span>
                    <p className="font-medium text-foreground">{metadata.width}x{metadata.height}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tamaño:</span>
                    <p className="font-medium text-foreground">{formatFileSize(metadata.size)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Formato:</span>
                    <p className="font-medium text-foreground">Video</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Subiendo... {Math.round(uploadProgress)}%
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
            disabled={uploading}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {preview ? "Cambiar video" : "Subir nuevo"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLibrary(true)}
              disabled={uploading}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Mi Biblioteca
            </Button>
          </div>
        </div>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <MediaLibrary
        open={showLibrary}
        onOpenChange={setShowLibrary}
        mediaType="video"
        onSelect={(item) => {
          setPreview(item.file_url);
          setThumbnail(item.thumbnail_url || "");
          setMetadata({
            duration: item.duration_seconds || 0,
            width: item.width || 0,
            height: item.height || 0,
            size: item.file_size
          });
          onChange(item.file_url);
          if (onMetadataExtracted) {
            onMetadataExtracted({
              thumbnail: item.thumbnail_url || "",
              width: item.width || 0,
              height: item.height || 0,
              size: item.file_size,
              duration: item.duration_seconds || 0
            });
          }
        }}
      />
    </div>
  );
};
