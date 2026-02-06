import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALIDATION_PROMPT = `Eres un experto revisor de código de Red Akasha. Tu tarea es validar código generado por IA antes de su integración.

## Criterios de Validación

### 1. Sintaxis y Estructura
- Código TypeScript/TSX válido
- Imports correctos
- Sin errores de sintaxis evidentes

### 2. Seguridad
- No hay exposición de secretos o API keys
- Políticas RLS adecuadas para tablas nuevas
- Validación de inputs del usuario
- Sin vulnerabilidades XSS o SQL injection

### 3. Lógica y Funcionalidad
- El código cumple con la descripción de la propuesta
- Manejo de errores apropiado
- Sin bugs lógicos evidentes

### 4. Compatibilidad
- Compatible con React 18 + TypeScript
- Usa tokens semánticos de Tailwind
- Compatible con la arquitectura existente

## Formato de Respuesta

Responde SOLO en formato JSON válido con esta estructura:
{
  "overallScore": 0-100,
  "passed": true/false,
  "validations": [
    {
      "type": "syntax|security|logic|compatibility",
      "status": "passed|failed|warning",
      "message": "Descripción del resultado",
      "details": "Detalles adicionales si aplica"
    }
  ],
  "summary": "Resumen general de la validación",
  "recommendations": ["Lista de recomendaciones si las hay"]
}`;

interface ValidateRequest {
  proposalId: string;
  code: {
    frontend: string;
    backend: string;
    database: string;
  };
  title: string;
  description: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { proposalId, code, title, description }: ValidateRequest = await req.json();

    console.log(`[validate-code] Starting validation for proposal ${proposalId}`);

    // Update proposal to validating stage
    await supabase
      .from("ia_feature_proposals")
      .update({ lifecycle_stage: "validating" })
      .eq("id", proposalId);

    // Create initial validation records
    const validationTypes = ["syntax", "security", "logic", "compatibility"];
    for (const type of validationTypes) {
      await supabase.from("ia_code_validations").insert({
        proposal_id: proposalId,
        validation_type: type,
        status: "pending",
      });
    }

    // Build the validation prompt
    const userPrompt = `## Propuesta: ${title}

### Descripción:
${description}

### Código a Validar:

#### Frontend (React/TSX):
\`\`\`tsx
${code.frontend || "// Sin código frontend"}
\`\`\`

#### Backend (Edge Functions):
\`\`\`typescript
${code.backend || "// Sin código backend"}
\`\`\`

#### Database (SQL):
\`\`\`sql
${code.database || "-- Sin código de base de datos"}
\`\`\`

Por favor, valida este código siguiendo los criterios establecidos y responde en formato JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: VALIDATION_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[validate-code] AI Error:", response.status, errorText);
      
      // Mark all validations as failed
      await supabase
        .from("ia_code_validations")
        .update({ status: "failed", ai_feedback: "Error de conexión con IA" })
        .eq("proposal_id", proposalId);
      
      await supabase
        .from("ia_feature_proposals")
        .update({ lifecycle_stage: "validation_failed", validation_score: 0 })
        .eq("id", proposalId);
      
      throw new Error(`Error de IA: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let validationResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      validationResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[validate-code] Failed to parse AI response:", parseError);
      validationResult = {
        overallScore: 50,
        passed: false,
        validations: [
          { type: "syntax", status: "warning", message: "No se pudo analizar la respuesta de IA" },
        ],
        summary: "Validación incompleta",
        recommendations: ["Revisar manualmente el código"],
      };
    }

    // Update validation records with results
    for (const validation of validationResult.validations || []) {
      await supabase
        .from("ia_code_validations")
        .update({
          status: validation.status === "passed" ? "passed" : validation.status === "warning" ? "passed" : "failed",
          ai_feedback: validation.message,
          details: { details: validation.details, recommendations: validationResult.recommendations },
          completed_at: new Date().toISOString(),
        })
        .eq("proposal_id", proposalId)
        .eq("validation_type", validation.type);
    }

    // Update proposal with final result
    const newStage = validationResult.passed ? "pending_approval" : "validation_failed";
    await supabase
      .from("ia_feature_proposals")
      .update({
        lifecycle_stage: newStage,
        validation_score: validationResult.overallScore || 0,
        review_notes: validationResult.summary,
      })
      .eq("id", proposalId);

    console.log(`[validate-code] Validation complete for ${proposalId}: ${newStage} (score: ${validationResult.overallScore})`);

    return new Response(
      JSON.stringify({
        success: true,
        passed: validationResult.passed,
        score: validationResult.overallScore,
        validations: validationResult.validations,
        summary: validationResult.summary,
        recommendations: validationResult.recommendations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[validate-code] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
