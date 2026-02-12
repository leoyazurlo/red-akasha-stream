/**
 * @fileoverview Hook para manejar el estado y lógica del App Builder.
 * Centraliza la comunicación con la IA y gestión del ciclo de vida.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notifySuccess, notifyError, notifyWarning } from "@/lib/notifications";
import { getAccessToken, invokeEdgeFunction } from "@/lib/api";
import type { GeneratedCode, ChatMessage, ProjectFile, UploadedFile } from "@/lib/types";

/** Código inicial por defecto */
const DEFAULT_CODE: GeneratedCode = {
  frontend: `function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-lg w-full rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">🚀 Akasha App Builder</h1>
          <p className="text-muted-foreground text-sm">Describe tu aplicación en el chat</p>
        </div>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Clicks: {count}
        </button>
      </div>
    </div>
  );
}`,
  backend: "// El código del backend aparecerá aquí...",
  database: "-- Las migraciones SQL aparecerán aquí...",
};

/** Keywords que indican solicitud de generación de código */
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

/**
 * Hook principal para el App Builder
 */
export function useAppBuilder() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>(DEFAULT_CODE);
  const [activeTab, setActiveTab] = useState<"frontend" | "backend" | "database">("frontend");
  const [lifecycleStage, setLifecycleStage] = useState("draft");
  const [validationScore, setValidationScore] = useState<number | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [input, setInput] = useState("");

  /**
   * Detecta si el mensaje es una solicitud de generación de código
   */
  const isCodeGenerationRequest = useCallback((message: string): boolean => {
    const m = message.toLowerCase();
    const hasCodeIntent = CODE_KEYWORDS.some((k) => m.includes(k));
    const hasEditIntent = EDIT_KEYWORDS.some((k) => m.includes(k));
    const hasUiTarget = UI_TARGETS.some((k) => m.includes(k));
    return hasCodeIntent || (hasEditIntent && hasUiTarget);
  }, []);

  /**
   * Envía un mensaje al chat
   */
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Construir mensaje con contexto de archivos
    let messageContent = input.trim();
    const completedFiles = uploadedFiles.filter((f) => f.status === "completed");

    if (completedFiles.length > 0) {
      messageContent += "\n\n[Archivos adjuntos:";
      completedFiles.forEach((file) => {
        messageContent += `\n- ${file.name} (${file.type})`;
        if (file.content) {
          messageContent += `:\n\`\`\`\n${file.content.slice(0, 5000)}\n\`\`\``;
        }
      });
      messageContent += "]";
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      files: completedFiles,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const shouldGenerateCode = isCodeGenerationRequest(input.trim());

      if (shouldGenerateCode) {
        // Flujo de generación de código
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

        // Crear propuesta
        const { data: { user } } = await supabase.auth.getUser();
        const { data: proposal } = await supabase
          .from("ia_feature_proposals")
          .insert([{
            title: input.trim().slice(0, 100),
            description: input.trim(),
            proposed_code: JSON.stringify(newCode),
            requested_by: user?.id,
            lifecycle_stage: "validating",
            status: "pending",
          }])
          .select()
          .single();

        if (proposal?.id) {
          setProposalId(proposal.id);
        }

        // Validar automáticamente
        setMessages([...newMessages, { role: "assistant", content: "✅ Código generado. Validando..." }]);
        setLifecycleStage("validating");

        try {
          const valData = await invokeEdgeFunction<{
            score: number;
            passed: boolean;
            summary?: string;
          }>("validate-code", {
            proposalId: proposal?.id,
            code: newCode,
            title: input.trim().slice(0, 100),
            description: input.trim(),
          });

          setValidationScore(valData.score);
          if (valData.passed) {
            setLifecycleStage("pending_approval");
            setMessages([...newMessages, {
              role: "assistant",
              content: `### ✅ Listo para producción\n\n**Score:** ${valData.score}/100\n\nUsa el botón **"Crear PR"** para integrarlo.`,
            }]);
          } else {
            setLifecycleStage("draft");
            setMessages([...newMessages, {
              role: "assistant",
              content: `### ⚠️ Necesita ajustes (${valData.score}/100)\n\n${valData.summary || "Revisa el código"}`,
            }]);
          }
        } catch {
          setLifecycleStage("draft");
          setMessages([...newMessages, {
            role: "assistant",
            content: "### ✅ Código generado\n\nNo se pudo validar automáticamente.",
          }]);
        }

        notifySuccess("Código generado exitosamente");
      } else {
        // Flujo de chat conversacional
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

        if (!response.ok) {
          throw new Error("Error al comunicarse con la IA");
        }

        // Stream de respuesta
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
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const payload = trimmed.slice(6).trim();
            if (payload === "[DONE]") break;

            try {
              const data = JSON.parse(payload);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
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

  /**
   * Valida el código generado
   */
  const validateCode = useCallback(async () => {
    if (!proposalId) {
      notifyWarning("Genera código primero");
      return;
    }

    setIsValidating(true);
    setLifecycleStage("validating");

    try {
      const data = await invokeEdgeFunction<{
        score: number;
        passed: boolean;
        summary?: string;
        recommendations?: string[];
      }>("validate-code", {
        proposalId,
        code: generatedCode,
        title: messages[0]?.content || "Aplicación",
        description: messages[0]?.content || "",
      });

      setValidationScore(data.score);

      if (data.passed) {
        setLifecycleStage("pending_approval");
        notifySuccess(`Validación exitosa (${data.score}/100)`);
      } else {
        setLifecycleStage("draft");
        notifyError(`Validación fallida (${data.score}/100)`);
      }
    } catch {
      notifyError("Error en validación");
      setLifecycleStage("draft");
    } finally {
      setIsValidating(false);
    }
  }, [proposalId, generatedCode, messages]);

  /**
   * Crea un Pull Request con el código
   */
  const createPullRequest = useCallback(async () => {
    if (!proposalId) {
      notifyWarning("No hay propuesta activa");
      return;
    }

    setIsCreatingPR(true);

    try {
      const data = await invokeEdgeFunction<{ prUrl?: string; error?: string }>(
        "github-create-pr",
        {
          proposalId,
          title: messages[0]?.content?.slice(0, 50) || "Nueva característica",
          description: messages[0]?.content || "",
          frontendCode: generatedCode.frontend,
          backendCode: generatedCode.backend,
          databaseCode: generatedCode.database,
        }
      );

      if (data.error) throw new Error(data.error);

      setLifecycleStage("merged");
      notifySuccess("Pull Request creado");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `🎉 **Pull Request creado**\n\n[Ver PR](${data.prUrl})`,
        },
      ]);
    } catch (err) {
      notifyError("Error al crear PR", err);
    } finally {
      setIsCreatingPR(false);
    }
  }, [proposalId, messages, generatedCode]);

  /**
   * Actualiza el código del tab activo
   */
  const handleCodeChange = useCallback((newCode: string) => {
    setGeneratedCode((prev) => ({ ...prev, [activeTab]: newCode }));
  }, [activeTab]);

  return {
    // State
    messages,
    generatedCode,
    activeTab,
    lifecycleStage,
    validationScore,
    proposalId,
    isLoading,
    isValidating,
    isCreatingPR,
    uploadedFiles,
    input,
    // Setters
    setMessages,
    setActiveTab,
    setUploadedFiles,
    setInput,
    // Actions
    sendMessage,
    validateCode,
    createPullRequest,
    handleCodeChange,
  };
}
