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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    // Verify user is authenticated (any user, not just admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Se requiere autenticación" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Sesión inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { title, description } = await req.json();
    console.log(`[generate-implementation] User ${userData.user.id} generating code: ${title}`);

    const apiKey = LOVABLE_API_KEY;
    const baseUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const selectedModel = "google/gemini-3-flash-preview";

    const userPrompt = `## Solicitud: ${title}

### Descripción:
${description}

### Requerimientos:
1. Genera el código frontend como componente React (función App) SIN imports, SIN TypeScript, SIN exports
2. Si aplica, genera código SQL para base de datos
3. Si aplica, genera Edge Functions para backend
4. El código debe ser COMPLETO y FUNCIONAL

Por favor, genera la implementación completa siguiendo las instrucciones del sistema.`;

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: IMPLEMENTATION_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-implementation] AI Error:", response.status, errorText);
      throw new Error(`Error de IA: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the generated code into sections
    const sqlMatch = content.match(/```sql\n([\s\S]*?)```/g);
    const tsMatch = content.match(/```typescript\n([\s\S]*?)```/g);
    const tsxMatch = content.match(/```tsx\n([\s\S]*?)```/g);
    // Also try to match jsx blocks
    const jsxMatch = content.match(/```jsx\n([\s\S]*?)```/g);

    const databaseCode = sqlMatch ? sqlMatch.map((m: string) => m.replace(/```sql\n|```/g, "")).join("\n\n") : "";
    const backendCode = tsMatch ? tsMatch.map((m: string) => m.replace(/```typescript\n|```/g, "")).join("\n\n") : "";
    
    // Prefer tsx, fallback to jsx
    let frontendCode = "";
    if (tsxMatch) {
      frontendCode = tsxMatch.map((m: string) => m.replace(/```tsx\n|```/g, "")).join("\n\n");
    } else if (jsxMatch) {
      frontendCode = jsxMatch.map((m: string) => m.replace(/```jsx\n|```/g, "")).join("\n\n");
    }

    // If no code blocks found, try to extract the raw content as frontend code
    if (!frontendCode && !backendCode && !databaseCode) {
      // Check if the content itself looks like code (has function App)
      if (content.includes("function App")) {
        frontendCode = content;
      }
    }

    console.log(`[generate-implementation] Success. Frontend: ${frontendCode.length} chars, Backend: ${backendCode.length} chars, DB: ${databaseCode.length} chars`);

    return new Response(
      JSON.stringify({
        success: true,
        frontend: frontendCode || "// No se generó código frontend",
        backend: backendCode || "// No se generó código backend",
        database: databaseCode || "-- No se generó código de base de datos",
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
