import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, AlertCircle, FolderOpen } from "lucide-react";
import { validateFile, getFileRequirements } from "@/lib/storage-validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MediaLibrary } from "@/components/MediaLibrary";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  description?: string;
  allowLocalPreview?: boolean; // Para permitir preview local sin subir
}

export const ImageUpload = ({ label, value, onChange, required, description, allowLocalPreview = false }: ImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requirements = getFileRequirements('image');
  const [showLibrary, setShowLibrary] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file using centralized validation
    const validation = validateFile(file, 'image');
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Si allowLocalPreview está habilitado, solo mostrar preview local
    if (allowLocalPreview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onChange(base64String);
      };
      reader.readAsDataURL(file);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      // Obtener usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Debes iniciar sesión");
      }

      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Subir archivo
      const { data, error } = await supabase.storage
        .from('profile-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(data.path);

      setPreview(publicUrl);
      onChange(publicUrl);

      // Guardar en biblioteca con tags y carpeta
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from('user_media_library').insert({
          user_id: currentUser.id,
          media_type: 'image',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          tags: ['image'],
          folder: 'Imágenes'
        });
      }

      toast({
        title: "¡Imagen subida!",
        description: "La imagen se ha subido correctamente",
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Cancelado",
          description: "La carga de la imagen fue cancelada",
        });
      } else {
        console.error('Error al subir imagen:', error);
        toast({
          title: "Error",
          description: error.message || "No se pudo subir la imagen",
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
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
            <img 
              src={preview} 
              alt="Vista previa" 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
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
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
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
                  {preview ? "Cambiar imagen" : "Subir nueva"}
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
        mediaType="image"
        onSelect={(item) => {
          setPreview(item.file_url);
          onChange(item.file_url);
        }}
      />
    </div>
  );
};
