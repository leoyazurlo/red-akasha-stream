import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Music,
  Code,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  File,
  Trash2,
  Eye,
} from "lucide-react";

export interface UploadedFile {
  id: string;
  name: string;
  type: "document" | "image" | "audio" | "code";
  status: "uploading" | "analyzing" | "completed" | "error";
  progress: number;
  analysis?: string;
  url?: string;
  content?: string;
}

interface ChatFileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
  disabled?: boolean;
}

const FILE_TYPE_MAP: Record<string, "document" | "image" | "audio" | "code"> = {
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "text/plain": "document",
  "text/csv": "document",
  "text/markdown": "document",
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "text/javascript": "code",
  "application/javascript": "code",
  "text/typescript": "code",
  "text/html": "code",
  "text/css": "code",
  "application/json": "code",
};

const getFileTypeIcon = (type: string) => {
  switch (type) {
    case "document": return <FileText className="h-4 w-4" />;
    case "image": return <ImageIcon className="h-4 w-4" />;
    case "audio": return <Music className="h-4 w-4" />;
    case "code": return <Code className="h-4 w-4" />;
    default: return <File className="h-4 w-4" />;
  }
};

const getFileTypeColor = (type: string) => {
  switch (type) {
    case "document": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "image": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "audio": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "code": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

export function ChatFileUpload({ onFilesChange, files, disabled }: ChatFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = useCallback((file: File): "document" | "image" | "audio" | "code" => {
    if (FILE_TYPE_MAP[file.type]) {
      return FILE_TYPE_MAP[file.type];
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (["ts", "tsx", "js", "jsx", "py", "rb", "go", "rs", "java", "cpp", "c", "h", "json", "yaml", "yml", "toml"].includes(ext || "")) {
      return "code";
    }
    if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext || "")) {
      return "audio";
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext || "")) {
      return "image";
    }
    return "document";
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    const fileId = crypto.randomUUID();
    const fileType = getFileType(file);
    
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      type: fileType,
      status: "uploading",
      progress: 0,
    };
    
    onFilesChange([...files, newFile]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Debes iniciar sesión");

      // For text/code files, read content directly
      let fileContent: string | undefined;
      if (fileType === "code" || (fileType === "document" && file.type.startsWith("text/"))) {
        fileContent = await file.text();
      }

      // Upload to storage
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${session.user.id}/${fileId}-${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("akasha-ia-files")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // Update progress
      const updatedFiles = files.map(f => 
        f.id === fileId ? { ...f, progress: 60 } : f
      );
      onFilesChange([...updatedFiles.filter(f => f.id !== fileId), { ...newFile, progress: 60 }]);

      // Get URL
      const { data: urlData } = supabase.storage
        .from("akasha-ia-files")
        .getPublicUrl(filePath);

      // Save to database
      const { data: fileRecord, error: dbError } = await supabase
        .from("ia_uploaded_files")
        .insert({
          user_id: session.user.id,
          file_name: file.name,
          file_type: fileType,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          extracted_text: fileContent?.slice(0, 100000),
          analysis_status: "completed",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Update file state with completed status
      const completedFile: UploadedFile = {
        id: fileRecord.id,
        name: file.name,
        type: fileType,
        status: "completed",
        progress: 100,
        url: urlData.publicUrl,
        content: fileContent,
      };

      onFilesChange([...files.filter(f => f.id !== fileId), completedFile]);
      toast.success(`${file.name} subido correctamente`);
    } catch (error) {
      console.error("Upload error:", error);
      onFilesChange(files.map(f => 
        f.id === fileId ? { ...f, status: "error" } : f
      ));
      toast.error(`Error al subir ${file.name}`);
    }
  }, [files, getFileType, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.slice(0, 5).forEach(uploadFile); // Max 5 files at once
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.slice(0, 5).forEach(uploadFile);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadFile]);

  const removeFile = useCallback((fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId));
  }, [files, onFilesChange]);

  const completedFiles = files.filter(f => f.status === "completed");
  const pendingFiles = files.filter(f => f.status !== "completed" && f.status !== "error");

  return (
    <div className="flex items-center gap-1">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 relative"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
            {files.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                {files.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start" side="top">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Subir archivos</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              La IA puede analizar imágenes, documentos y código
            </p>
          </div>

          {/* Drop Zone */}
          <div
            className={`m-3 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground mb-2">
              Arrastra archivos aquí
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-xs"
            >
              Seleccionar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.csv,.md,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.js,.ts,.tsx,.jsx,.py,.json,.html,.css,.yaml,.yml"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <ScrollArea className="max-h-48 border-t border-border">
              <div className="p-2 space-y-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50"
                  >
                    <div className={`p-1.5 rounded ${getFileTypeColor(file.type)}`}>
                      {getFileTypeIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="h-1 mt-1" />
                      )}
                      {file.status === "analyzing" && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Analizando...
                        </span>
                      )}
                      {file.status === "completed" && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="h-2.5 w-2.5" />
                          Listo
                        </span>
                      )}
                      {file.status === "error" && (
                        <span className="text-[10px] text-destructive flex items-center gap-1">
                          <AlertCircle className="h-2.5 w-2.5" />
                          Error
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="p-2 border-t border-border bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              Máx 5 archivos • 20MB cada uno
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Inline file badges */}
      {completedFiles.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto max-w-40">
          {completedFiles.slice(0, 2).map((file) => (
            <Badge
              key={file.id}
              variant="outline"
              className={`h-6 gap-1 text-[10px] shrink-0 ${getFileTypeColor(file.type)}`}
            >
              {getFileTypeIcon(file.type)}
              <span className="max-w-16 truncate">{file.name}</span>
              <button onClick={() => removeFile(file.id)} className="ml-0.5 hover:text-destructive">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          {completedFiles.length > 2 && (
            <Badge variant="outline" className="h-6 text-[10px]">
              +{completedFiles.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Pending indicator */}
      {pendingFiles.length > 0 && (
        <Badge variant="secondary" className="h-6 gap-1 text-[10px]">
          <Loader2 className="h-3 w-3 animate-spin" />
          {pendingFiles.length}
        </Badge>
      )}
    </div>
  );
}
