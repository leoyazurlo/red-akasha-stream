import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProviderConfig {
  id: string;
  provider: string;
  api_key_encrypted: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
}

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  provider?: string; // optional - use specific provider
  model?: string; // optional - use specific model
  stream?: boolean;
  generateCode?: boolean; // for code generation mode
}

// Provider-specific API configurations
const PROVIDER_CONFIGS: Record<string, {
  baseUrl: string;
  authHeader: (key: string) => Record<string, string>;
  formatRequest: (messages: any[], model: string, stream: boolean) => object;
  parseResponse: (response: any) => string;
}> = {
  lovable: {
    baseUrl: "https://ai.gateway.lovable.dev/v1/chat/completions",
    authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    formatRequest: (messages, model, stream) => ({
      model: model || "google/gemini-3-flash-preview",
      messages,
      stream,
    }),
    parseResponse: (r) => r.choices?.[0]?.message?.content || "",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    formatRequest: (messages, model, stream) => ({
      model: model || "gpt-4o",
      messages,
      stream,
    }),
    parseResponse: (r) => r.choices?.[0]?.message?.content || "",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1/messages",
    authHeader: (key) => ({
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    }),
    formatRequest: (messages, model, stream) => {
      // Anthropic expects system message separately
      const systemMsg = messages.find((m: any) => m.role === "system");
      const otherMsgs = messages.filter((m: any) => m.role !== "system");
      return {
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemMsg?.content || "",
        messages: otherMsgs,
        stream,
      };
    },
    parseResponse: (r) => r.content?.[0]?.text || "",
  },
  google: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    authHeader: () => ({}), // Key goes in URL
    formatRequest: (messages, model) => ({
      contents: messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    }),
    parseResponse: (r) => r.candidates?.[0]?.content?.parts?.[0]?.text || "",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    formatRequest: (messages, model, stream) => ({
      model: model || "llama-3.3-70b-versatile",
      messages,
      stream,
    }),
    parseResponse: (r) => r.choices?.[0]?.message?.content || "",
  },
  mistral: {
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    formatRequest: (messages, model, stream) => ({
      model: model || "mistral-large-latest",
      messages,
      stream,
    }),
    parseResponse: (r) => r.choices?.[0]?.message?.content || "",
  },
  ollama: {
    baseUrl: "", // Will be set from config
    authHeader: () => ({}),
    formatRequest: (messages, model) => ({
      model: model || "llama3.2",
      messages,
      stream: false,
    }),
    parseResponse: (r) => r.message?.content || "",
  },
};

// System prompt for code generation
const CODE_GENERATION_PROMPT = `Eres un experto desarrollador de Red Akasha. Cuando generes código:

1. **Frontend (React/TypeScript)**: Usa shadcn/ui, Tailwind CSS, y hooks de React
2. **Backend (Edge Functions)**: Usa Deno con Supabase client
3. **Base de datos**: Genera SQL compatible con PostgreSQL/Supabase

Responde siempre con bloques de código claramente marcados:
- \`\`\`tsx para componentes React
- \`\`\`typescript para edge functions
- \`\`\`sql para migraciones

Incluye comentarios explicativos y sigue las mejores prácticas de la plataforma.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messages, provider, model, stream = true, generateCode }: ChatRequest = await req.json();

    // Get configured providers
    const { data: configs } = await supabase
      .from("ia_api_configs")
      .select("*")
      .eq("is_active", true)
      .order("is_default", { ascending: false });

    // Select provider: specified, default, or fallback to lovable
    let selectedConfig: ProviderConfig | null = null;
    let providerName = "lovable"; // Default to lovable

    if (provider) {
      // User specified a provider
      if (provider === "lovable") {
        // Use lovable directly without checking DB
        providerName = "lovable";
      } else {
        selectedConfig = configs?.find((c) => c.provider === provider) as ProviderConfig | null;
        if (!selectedConfig) {
          throw new Error(`Proveedor ${provider} no está configurado o activo`);
        }
        providerName = selectedConfig.provider;
      }
    } else if (configs && configs.length > 0) {
      // Use default or first available
      selectedConfig = configs[0] as ProviderConfig;
      providerName = selectedConfig.provider;
    }
    // else: use lovable as fallback

    const providerConfig = PROVIDER_CONFIGS[providerName];

    if (!providerConfig) {
      throw new Error(`Proveedor ${providerName} no soportado`);
    }

    // Get API key
    let apiKey = selectedConfig?.api_key_encrypted || null;
    
    // For Lovable provider, always use the LOVABLE_API_KEY
    if (providerName === "lovable") {
      apiKey = Deno.env.get("LOVABLE_API_KEY") || null;
      if (!apiKey) {
        throw new Error("LOVABLE_API_KEY no está configurada");
      }
    }

    // Build request URL
    let requestUrl = providerConfig.baseUrl;
    if (providerName === "google" && apiKey) {
      const modelName = model || "gemini-1.5-flash";
      requestUrl = `${providerConfig.baseUrl}/${modelName}:generateContent?key=${apiKey}`;
    } else if (providerName === "ollama" && selectedConfig) {
      const ollamaUrl = (selectedConfig.config as any)?.ollama_url || "http://localhost:11434";
      requestUrl = `${ollamaUrl}/api/chat`;
    }

    // Prepare messages with optional code generation prompt
    let finalMessages = messages;
    if (generateCode) {
      finalMessages = [
        { role: "system", content: CODE_GENERATION_PROMPT },
        ...messages,
      ];
    }

    // Build request body
    const requestBody = providerConfig.formatRequest(finalMessages, model || "", stream);

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...providerConfig.authHeader(apiKey || ""),
    };

    console.log(`[multi-ai-provider] Using provider: ${providerName}, model: ${model || "default"}`);

    // Make the request
    const response = await fetch(requestUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[multi-ai-provider] Error from ${providerName}:`, response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requieren créditos adicionales para este proveedor." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Error del proveedor ${providerName}: ${response.status}`);
    }

    // For streaming responses
    if (stream && providerName !== "ollama" && providerName !== "google") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // For non-streaming responses
    const data = await response.json();
    const content = providerConfig.parseResponse(data);

    return new Response(
      JSON.stringify({ 
        content,
        provider: providerName,
        model: model || "default",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[multi-ai-provider] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
