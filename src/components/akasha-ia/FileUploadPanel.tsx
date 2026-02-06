import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Code,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface FileUploadPanelProps {
  conversationId?: string | null;
  onFileAnalyzed: (fileId: string, analysis: string, fileType: string) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: "document" | "image" | "audio" | "code";
  status: "uploading" | "analyzing" | "completed" | "error";
  progress: number;
  analysis?: string;
  url?: string;
}

const FILE_TYPE_MAP: Record<string, "document" | "image" | "audio" | "code"> = {
  // Documents
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "text/plain": "document",
  "text/csv": "document",
  // Images
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  // Audio
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  "audio/flac": "audio",
  // Code
  "text/javascript": "code",
  "application/javascript": "code",
  "text/typescript": "code",
  "text/html": "code",
  "text/css": "code",
  "application/json": "code",
};

const getFileTypeIcon = (type: string) => {
  switch (type) {
    case "document": return <FileText className="h-5 w-5" />;
    case "image": return <ImageIcon className="h-5 w-5" />;
    case "audio": return <Music className="h-5 w-5" />;
    case "code": return <Code className="h-5 w-5" />;
    default: return <FileText className="h-5 w-5" />;
  }
};

export function FileUploadPanel({ conversationId, onFileAnalyzed }: FileUploadPanelProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): "document" | "image" | "audio" | "code" => {
    // Check by MIME type first
    if (FILE_TYPE_MAP[file.type]) {
      return FILE_TYPE_MAP[file.type];
    }
    
    // Fall back to extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (["ts", "tsx", "js", "jsx", "py", "rb", "go", "rs", "java", "cpp", "c", "h"].includes(ext || "")) {
      return "code";
    }
    if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext || "")) {
      return "audio";
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext || "")) {
      return "image";
    }
    
    return "document";
  };

  const uploadFile = async (file: File) => {
    const fileId = crypto.randomUUID();
    const fileType = getFileType(file);
    
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      type: fileType,
      status: "uploading",
      progress: 0
    };
    
    setFiles(prev => [...prev, newFile]);

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // Upload to storage
      const filePath = `${session.user.id}/${fileId}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("akasha-ia-files")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) throw uploadError;

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 50 } : f
      ));

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("akasha-ia-files")
        .getPublicUrl(filePath);

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabase
        .from("ia_uploaded_files")
        .insert({
          user_id: session.user.id,
          conversation_id: conversationId,
          file_name: file.name,
          file_type: fileType,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          analysis_status: "analyzing"
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, id: fileRecord.id, url: urlData.publicUrl, progress: 75, status: "analyzing" } : f
      ));

      // Analyze the file
      let analysisResult: string;
      
      if (fileType === "image") {
        // For images, use AI vision
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-multimodal`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: "analyze_image",
              data: {
                fileId: fileRecord.id,
                imageUrl: urlData.publicUrl
              }
            })
          }
        );
        
        const result = await response.json();
        analysisResult = result.result || "Análisis completado";
        
      } else if (fileType === "code" || fileType === "document") {
        // For text files, read content and analyze
        const content = await file.text();
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-multimodal`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: "analyze_document",
              data: {
                fileId: fileRecord.id,
                content: content.slice(0, 50000), // Limit content size
                fileType: fileType === "code" ? file.name.split('.').pop() : "document"
              }
            })
          }
        );
        
        const result = await response.json();
        analysisResult = result.result || "Análisis completado";
        
      } else if (fileType === "audio") {
        // For audio, send metadata for analysis
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-multimodal`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: "analyze_audio",
              data: {
                fileId: fileRecord.id,
                metadata: {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  duration: null // Would need audio player to get actual duration
                }
              }
            })
          }
        );
        
        const result = await response.json();
        analysisResult = result.result || "Análisis de audio completado";
      } else {
        analysisResult = "Archivo subido correctamente";
      }

      setFiles(prev => prev.map(f => 
        f.id === fileRecord.id ? { ...f, progress: 100, status: "completed", analysis: analysisResult } : f
      ));

      onFileAnalyzed(fileRecord.id, analysisResult, fileType);
      toast.success(`${file.name} analizado correctamente`);

    } catch (error) {
      console.error("Upload error:", error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: "error" } : f
      ));
      toast.error(`Error al procesar ${file.name}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(uploadFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(uploadFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Arrastra archivos aquí o
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Seleccionar archivos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.flac,.js,.ts,.tsx,.jsx,.py,.json,.html,.css"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Documentos, imágenes, audio, código (máx 50MB)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Archivos</Label>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
            >
              <div className={`p-2 rounded-lg ${
                file.type === "image" ? "bg-purple-500/20 text-purple-400" :
                file.type === "audio" ? "bg-green-500/20 text-green-400" :
                file.type === "code" ? "bg-blue-500/20 text-blue-400" :
                "bg-orange-500/20 text-orange-400"
              }`}>
                {getFileTypeIcon(file.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                {file.status === "uploading" && (
                  <Progress value={file.progress} className="h-1 mt-1" />
                )}
                {file.status === "analyzing" && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analizando con IA...
                  </p>
                )}
                {file.status === "completed" && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Análisis completado
                  </p>
                )}
                {file.status === "error" && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error al procesar
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
