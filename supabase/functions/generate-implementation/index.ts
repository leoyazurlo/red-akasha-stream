import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMPLEMENTATION_PROMPT = `Eres un experto arquitecto de software de Red Akasha. Tu tarea es generar código de implementación completo y funcional.

## Arquitectura de Red Akasha
- **Frontend**: React 18 + Tailwind CSS (ejecutado en un Sandbox con UMD React)
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)

## REGLAS CRÍTICAS PARA EL CÓDIGO FRONTEND (tsx)

El código frontend se ejecuta en un sandbox con React UMD. DEBES seguir estas reglas:

1. **NO uses import statements** — React, useState, useEffect, useCallback, useMemo, useRef, memo están disponibles globalmente
2. **NO uses anotaciones TypeScript** — ni interfaces, ni tipos, ni genéricos, ni "as const"
3. **El componente principal DEBE llamarse \`App\`** y ser una función declarada con \`function App()\`
4. **Componentes UI disponibles globalmente** (NO importarlos): Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Badge, Label, Textarea, Switch, Checkbox, Select, SelectItem, Avatar, Progress, Separator, Skeleton, Alert, Tabs, TabsList, TabsTrigger, TabsContent, Dialog, DialogContent, DialogHeader, DialogTitle, ScrollArea, Tooltip, Icons (Icons.Loader, Icons.Check, Icons.X, Icons.Plus, Icons.Search)
5. **Usa clases Tailwind semánticas**: bg-background, text-foreground, bg-card, bg-primary, text-primary-foreground, bg-muted, text-muted-foreground, bg-secondary, border-border, bg-destructive, bg-accent, text-accent
6. **NO uses export default** ni export nombrado

### Ejemplo correcto de frontend:
\`\`\`tsx
function App() {
  const [items, setItems] = React.useState([]);
  const [input, setInput] = React.useState("");

  const addItem = () => {
    if (input.trim()) {
      setItems(prev => [...prev, { id: Date.now(), text: input }]);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Mi App</CardTitle>
          <CardDescription>Descripción aquí</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe algo..." />
            <Button onClick={addItem}>Agregar</Button>
          </div>
          <div className="mt-4 space-y-2">
            {items.map(item => (
              <div key={item.id} className="p-2 bg-muted rounded-md text-sm">{item.text}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
\`\`\`

## Para SQL (migraciones de base de datos):
\`\`\`sql
-- Descripción de la migración
CREATE TABLE...
-- Incluir RLS policies
\`\`\`

## Para Edge Functions (backend):
\`\`\`typescript
// supabase/functions/nombre-funcion/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
...
\`\`\`

## Reglas generales:
1. SIEMPRE incluye RLS policies para tablas nuevas
2. Incluye manejo de errores completo
3. Genera código COMPLETO y FUNCIONAL, no fragmentos parciales`;

interface GenerateRequest {
  proposalId: string;
  title: string;
  description: string;
  provider?: string;
  model?: string;
}

// Helper function to verify admin authentication
async function verifyAdminAuth(req: Request, supabase: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return null;
  }

  // Check if user is admin - REQUIRED for this endpoint
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: roleData } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .single();

  if (!roleData) {
    return null;
  }

  return { userId: data.user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    // Create client for auth verification
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });

    // Verify ADMIN authentication - REQUIRED for this endpoint
    const auth = await verifyAdminAuth(req, authClient);
    
    if (!auth) {
      console.log("[generate-implementation] Unauthorized request - admin access required");
      return new Response(
        JSON.stringify({ error: "Acceso denegado. Se requiere rol de administrador." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { proposalId, title, description, provider, model }: GenerateRequest = await req.json();

    console.log(`[generate-implementation] Admin ${auth.userId} generating code for proposal ${proposalId}`);

    // Get provider config if specified
    let apiKey = LOVABLE_API_KEY;
    let baseUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let selectedModel = model || "google/gemini-3-flash-preview";
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    if (provider && provider !== "lovable") {
      const { data: config } = await supabase
        .from("ia_api_configs")
        .select("*")
        .eq("provider", provider)
        .eq("is_active", true)
        .single();

      if (config && config.api_key_encrypted) {
        apiKey = config.api_key_encrypted;
        
        switch (provider) {
          case "openai":
            baseUrl = "https://api.openai.com/v1/chat/completions";
            selectedModel = model || "gpt-4o";
            headers = {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            };
            break;
          case "anthropic":
            baseUrl = "https://api.anthropic.com/v1/messages";
            selectedModel = model || "claude-3-5-sonnet-20241022";
            headers = {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            };
            break;
        }
      }
    }

    // Build the prompt
    const userPrompt = `## Propuesta: ${title}

### Descripción:
${description}

### Requerimientos:
1. Genera el código SQL necesario (si aplica)
2. Genera las Edge Functions necesarias (si aplica)
3. Genera los componentes React necesarios
4. Asegúrate de que todo el código esté completo y listo para usar

Por favor, genera la implementación completa siguiendo las instrucciones del sistema.`;

    let requestBody: object;
    
    if (provider === "anthropic") {
      requestBody = {
        model: selectedModel,
        max_tokens: 8192,
        system: IMPLEMENTATION_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      };
    } else {
      requestBody = {
        model: selectedModel,
        messages: [
          { role: "system", content: IMPLEMENTATION_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8192,
      };
    }

    const response = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-implementation] AI Error:", response.status, errorText);
      throw new Error(`Error de IA: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse response based on provider
    let content: string;
    if (provider === "anthropic") {
      content = data.content?.[0]?.text || "";
    } else {
      content = data.choices?.[0]?.message?.content || "";
    }

    // Parse the generated code into sections
    const sqlMatch = content.match(/```sql\n([\s\S]*?)```/g);
    const tsMatch = content.match(/```typescript\n([\s\S]*?)```/g);
    const tsxMatch = content.match(/```tsx\n([\s\S]*?)```/g);

    const databaseCode = sqlMatch ? sqlMatch.map(m => m.replace(/```sql\n|```/g, "")).join("\n\n") : "";
    const backendCode = tsMatch ? tsMatch.map(m => m.replace(/```typescript\n|```/g, "")).join("\n\n") : "";
    const frontendCode = tsxMatch ? tsxMatch.map(m => m.replace(/```tsx\n|```/g, "")).join("\n\n") : "";

    // Save the generated code to the proposal
    const proposedCode = JSON.stringify({
      frontend: frontendCode || "// No se generó código frontend",
      backend: backendCode || "// No se generó código backend",
      database: databaseCode || "-- No se generó código de base de datos",
      rawResponse: content,
      generatedAt: new Date().toISOString(),
      provider: provider || "lovable",
      model: selectedModel,
      generatedBy: auth.userId,
    });

    await supabase
      .from("ia_feature_proposals")
      .update({ 
        proposed_code: proposedCode,
        status: "reviewing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    console.log(`[generate-implementation] Successfully generated code for proposal ${proposalId} by admin ${auth.userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        frontend: frontendCode || "// No se generó código frontend",
        backend: backendCode || "// No se generó código backend",
        database: databaseCode || "-- No se generó código de base de datos",
        provider: provider || "lovable",
        model: selectedModel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-implementation] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
