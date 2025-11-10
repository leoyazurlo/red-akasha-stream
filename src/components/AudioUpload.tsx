import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Music } from "lucide-react";
import { validateFile } from "@/lib/storage-validation";

interface AudioUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  description?: string;
}

export const AudioUpload = ({ label, value, onChange, required, description }: AudioUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, 'audio');
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Debes iniciar sesión");
      }

      const fileExt = file.name.split('.').pop();
      const uploadFileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('content-audios')
        .upload(uploadFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('content-audios')
        .getPublicUrl(data.path);

      setPreview(publicUrl);
      onChange(publicUrl);

      toast({
        title: "¡Audio subido!",
        description: "El audio se ha subido correctamente",
      });
    } catch (error: any) {
      console.error('Error al subir audio:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el audio",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    setFileName("");
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
      
      <div className="flex flex-col gap-4">
        {preview && (
          <div className="relative w-full max-w-md rounded-lg border-2 border-border p-4 bg-muted">
            <div className="flex items-center gap-3 mb-3">
              <Music className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium truncate">{fileName}</span>
            </div>
            <audio 
              src={preview} 
              controls
              className="w-full"
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

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
            id="audio-upload"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full sm:w-auto"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {preview ? "Cambiar audio" : "Seleccionar audio"}
              </>
            )}
          </Button>
        </div>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
