/**
 * @fileoverview Hook simplificado para el App Builder.
 * Sin validación, aprobación ni PR - solo genera código y lo muestra.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getAccessToken, invokeEdgeFunction } from "@/lib/api";
import type { GeneratedCode, ChatMessage, UploadedFile } from "@/lib/types";

const DEFAULT_CODE: GeneratedCode = {
  frontend: `function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-lg w-full rounded-xl border border-border bg-card p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground mb-2">🚀 Akasha App Builder</h1>
        <p className="text-muted-foreground text-sm mb-4">Describe tu aplicación en el chat</p>
        <button onClick={() => setCount(c => c + 1)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Clicks: {count}
        </button>
      </div>
    </div>
  );
}`,
  backend: "// El código del backend aparecerá aquí...",
  database: "-- Las migraciones SQL aparecerán aquí...",
};

const CODE_KEYWORDS = [
  "genera", "generar", "crea", "crear", "implementa", "implementar",
  "desarrolla", "desarrollar", "construye", "construir", "programa",
  "codifica", "escribe código", "create", "build", "generate", "implement",
];

const EDIT_KEYWORDS = [
  "cambia", "cambiar", "modifica", "modificar", "actualiza", "actualizar",
  "quita", "quitar", "agrega", "agregar", "arregla", "arreglar", "fix",
];

const UI_TARGETS = [
  "footer", "header", "navbar", "menú", "menu", "botón", "boton",
  "color", "estilo", "css", "layout", "diseño", "responsive",
];

export function useAppBuilder() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>(DEFAULT_CODE);
  const [activeTab, setActiveTab] = useState<"frontend" | "backend" | "database">("frontend");
  const [lifecycleStage, setLifecycleStage] = useState("draft");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [input, setInput] = useState("");

  const isCodeGenerationRequest = useCallback((message: string): boolean => {
    const m = message.toLowerCase();
    const hasCodeIntent = CODE_KEYWORDS.some((k) => m.includes(k));
    const hasEditIntent = EDIT_KEYWORDS.some((k) => m.includes(k));
    const hasUiTarget = UI_TARGETS.some((k) => m.includes(k));
    return hasCodeIntent || (hasEditIntent && hasUiTarget);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    let messageContent = input.trim();
    const completedFiles = uploadedFiles.filter((f) => f.status === "completed");

    if (completedFiles.length > 0) {
      messageContent += "\n\n[Archivos adjuntos:";
      completedFiles.forEach((file) => {
        messageContent += `\n- ${file.name} (${file.type})`;
        if (file.content) messageContent += `:\n\`\`\`\n${file.content.slice(0, 5000)}\n\`\`\``;
      });
      messageContent += "]";
    }

    const userMessage: ChatMessage = { role: "user", content: input.trim(), files: completedFiles };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const shouldGenerateCode = isCodeGenerationRequest(input.trim());

      if (shouldGenerateCode) {
        setLifecycleStage("generating");
        setMessages([...newMessages, { role: "assistant", content: "⚡ Generando código..." }]);

        const implData = await invokeEdgeFunction<{
          frontend?: string;
          backend?: string;
          database?: string;
        }>("generate-implementation", {
          title: input.trim().slice(0, 100),
          description: messageContent,
        });

        const newCode: GeneratedCode = {
          frontend: implData.frontend || generatedCode.frontend,
          backend: implData.backend || generatedCode.backend,
          database: implData.database || generatedCode.database,
        };
        setGeneratedCode(newCode);
        setLifecycleStage("ready");
        setMessages([...newMessages, {
          role: "assistant",
          content: `### ✅ Código generado\n\nRevisa el código en el editor y la vista previa.`,
        }]);

        notifySuccess("Código generado exitosamente");
      } else {
        // Chat conversacional
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            }),
          }
        );

        if (!response.ok) throw new Error("Error al comunicarse con la IA");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No se pudo leer la respuesta");

        const decoder = new TextDecoder();
        let assistantContent = "";
        let buffer = "";

        setMessages([...newMessages, { role: "assistant", content: "..." }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let newlineIndex: number;

          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data: ")) continue;

            const payload = trimmed.slice(6).trim();
            if (payload === "[DONE]") continue;

            try {
              const data = JSON.parse(payload);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
              }
            } catch {
              console.warn("[AppBuilder] Skipping unparseable SSE chunk");
            }
          }
        }

        if (assistantContent) {
          setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      notifyError("Error al procesar mensaje", error);
      setLifecycleStage("draft");
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, uploadedFiles, isLoading, generatedCode, isCodeGenerationRequest]);

  const handleCodeChange = useCallback((newCode: string) => {
    setGeneratedCode((prev) => ({ ...prev, [activeTab]: newCode }));
  }, [activeTab]);

  return {
    messages, generatedCode, activeTab, lifecycleStage,
    isLoading, uploadedFiles, input,
    setMessages, setActiveTab, setUploadedFiles, setInput,
    sendMessage, handleCodeChange,
  };
}
