/**
 * @fileoverview Componente de subida de archivos para el chat de IA.
 */
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paperclip, X, Loader2 } from "lucide-react";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "completed" | "error";
  content?: string;
  preview?: string;
}

interface ChatFileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export async function processFileForUpload(
  file: File,
  currentFiles: UploadedFile[],
  setFiles: (files: UploadedFile[]) => void
) {
  const id = crypto.randomUUID();
  const newFile: UploadedFile = {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    status: "uploading",
  };
  const updated = [...currentFiles, newFile];
  setFiles(updated);

  try {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      const content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setFiles(updated.map(f => f.id === id ? { ...f, status: "completed", content, preview: content } : f));
    } else {
      const text = await file.text();
      setFiles(updated.map(f => f.id === id ? { ...f, status: "completed", content: text } : f));
    }
  } catch {
    setFiles(updated.map(f => f.id === id ? { ...f, status: "error" } : f));
  }
}

export function ChatFileUpload({ files, onFilesChange, disabled }: ChatFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    for (const file of Array.from(selected)) {
      await processFileForUpload(file, files, onFilesChange);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        title="Adjuntar archivo"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <input ref={inputRef} type="file" className="hidden" multiple onChange={handleChange} accept="image/*,.txt,.json,.ts,.tsx,.js,.jsx,.css,.html,.md" />
      {files.map(f => (
        <Badge key={f.id} variant="secondary" className="text-xs gap-1">
          {f.status === "uploading" && <Loader2 className="h-3 w-3 animate-spin" />}
          {f.name.length > 15 ? f.name.slice(0, 12) + "..." : f.name}
          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFile(f.id)} />
        </Badge>
      ))}
    </div>
  );
}
