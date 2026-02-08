/**
 * @fileoverview Panel de chat del App Builder.
 * Maneja la comunicación entre el usuario y la IA.
 */

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, Code, Eye, FileCode } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatFileUpload, type UploadedFile, processFileForUpload } from "../ChatFileUpload";
import type { ChatMessage } from "@/lib/types";
import { toast } from "sonner";

interface ChatPanelProps {
  /** Lista de mensajes del chat */
  messages: ChatMessage[];
  /** Valor actual del input */
  inputValue: string;
  /** Callback cuando cambia el input */
  onInputChange: (value: string) => void;
  /** Callback para enviar mensaje */
  onSendMessage: () => void;
  /** Si está procesando una respuesta */
  isLoading: boolean;
  /** Archivos subidos pendientes */
  uploadedFiles: UploadedFile[];
  /** Callback cuando cambian los archivos */
  onFilesChange: (files: UploadedFile[]) => void;
}

/**
 * Panel de chat con la IA de Akasha
 */
export function ChatPanel({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  uploadedFiles,
  onFilesChange,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Maneja el pegado de archivos desde el portapapeles
   */
  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];

      // Manejar imágenes
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const timestamp = Date.now();
          const ext = item.type.split("/")[1] || "png";
          const namedFile = new File(
            [file],
            `pasted-image-${timestamp}.${ext}`,
            { type: file.type }
          );
          toast.info("Procesando imagen pegada...");
          await processFileForUpload(namedFile, uploadedFiles, onFilesChange);
        }
      }

      // Manejar otros archivos
      if (item.kind === "file" && !item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          toast.info("Procesando archivo pegado...");
          await processFileForUpload(file, uploadedFiles, onFilesChange);
        }
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b border-cyan-500/10 flex-shrink-0">
        <Sparkles className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-medium">AKASHA IA</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0 max-h-[calc(100%-80px)]">
        <div className="space-y-3 pb-2">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Describe qué quieres crear...
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-xs p-2 rounded-lg break-words ${
                msg.role === "user"
                  ? "bg-cyan-500/20 text-foreground ml-4"
                  : "bg-muted/50 text-muted-foreground mr-4"
              }`}
            >
              {/* Archivos adjuntos */}
              {msg.files && msg.files.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {msg.files.map((file) => (
                    <Badge
                      key={file.id}
                      variant="outline"
                      className="text-[10px] gap-1 h-5"
                    >
                      {file.type === "image" && <Eye className="h-2.5 w-2.5" />}
                      {file.type === "code" && <Code className="h-2.5 w-2.5" />}
                      {file.type === "document" && <FileCode className="h-2.5 w-2.5" />}
                      {file.name.slice(0, 15)}
                      {file.name.length > 15 ? "..." : ""}
                    </Badge>
                  ))}
                </div>
              )}
              {/* Contenido del mensaje */}
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 prose-pre:my-2 prose-code:text-cyan-400">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generando código...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-2 border-t border-cyan-500/10">
        <div className="flex gap-1 items-center">
          <ChatFileUpload
            files={uploadedFiles}
            onFilesChange={onFilesChange}
            disabled={isLoading}
          />
          <Input
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={
              uploadedFiles.length > 0
                ? "Describe qué hacer con los archivos..."
                : "Describe tu aplicación... (Ctrl+V para pegar imágenes)"
            }
            className="text-xs h-8 flex-1"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSendMessage()}
            disabled={isLoading}
            onPaste={handlePaste}
          />
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={onSendMessage}
            disabled={isLoading || (!inputValue.trim() && uploadedFiles.length === 0)}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
