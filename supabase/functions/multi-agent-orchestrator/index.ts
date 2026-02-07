import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Agent {
  id: string;
  name: string;
  display_name: string;
  role: string;
  system_prompt: string;
  capabilities: string[];
}

interface OrchestrationRequest {
  sessionId?: string;
  message: string;
  context?: {
    code?: { frontend?: string; backend?: string; database?: string };
    proposalId?: string;
    stage?: string;
  };
  requestedAgents?: string[]; // Roles específicos a invocar
}

interface AgentResponse {
  agentId: string;
  agentName: string;
  agentRole: string;
  response: string;
  processingTimeMs: number;
  suggestedNextAgents?: string[];
}

// Determinar qué agentes invocar según el contexto del mensaje
function determineAgentsToInvoke(message: string, context: any, agents: Agent[]): Agent[] {
  const lowerMessage = message.toLowerCase();
  const selectedAgents: Agent[] = [];
  
  // Palabras clave por rol
  const roleKeywords: Record<string, string[]> = {
    design: ["diseño", "ui", "ux", "interfaz", "colores", "tipografía", "layout", "visual", "estilo", "responsive", "accesibilidad"],
    code: ["código", "componente", "función", "react", "typescript", "implementar", "crear", "desarrollar", "edge function", "api"],
    testing: ["test", "prueba", "validar", "bug", "error", "seguridad", "vulnerabilidad", "revisar", "calidad"],
    legal: ["licencia", "copyright", "gdpr", "privacidad", "términos", "legal", "compliance", "derechos"],
    governance: ["votación", "votar", "comunidad", "aprobar", "rechazar", "consenso", "propuesta", "gobernanza"],
  };
  
  // Encontrar agentes relevantes
  for (const agent of agents) {
    const keywords = roleKeywords[agent.role] || [];
    const isRelevant = keywords.some(kw => lowerMessage.includes(kw));
    
    if (isRelevant) {
      selectedAgents.push(agent);
    }
  }
  
  // Si hay código en el contexto, incluir coder y tester
  if (context?.code?.frontend || context?.code?.backend) {
    const coder = agents.find(a => a.role === "code");
    const tester = agents.find(a => a.role === "testing");
    if (coder && !selectedAgents.includes(coder)) selectedAgents.push(coder);
    if (tester && !selectedAgents.includes(tester)) selectedAgents.push(tester);
  }
  
  // Si no hay agentes específicos, usar el coder como default
  if (selectedAgents.length === 0) {
    const coder = agents.find(a => a.role === "code");
    if (coder) selectedAgents.push(coder);
  }
  
  // Ordenar por prioridad (menor primero)
  return selectedAgents.sort((a, b) => (a as any).priority - (b as any).priority);
}

// Invocar un agente específico
async function invokeAgent(
  agent: Agent,
  message: string,
  context: any,
  previousResponses: AgentResponse[],
  apiKey: string
): Promise<AgentResponse> {
  const startTime = Date.now();
  
  // Construir contexto con respuestas de otros agentes
  let enhancedPrompt = agent.system_prompt;
  if (previousResponses.length > 0) {
    enhancedPrompt += "\n\n## Contexto de otros agentes:\n";
    for (const resp of previousResponses) {
      enhancedPrompt += `\n### ${resp.agentName} (${resp.agentRole}):\n${resp.response}\n`;
    }
  }
  
  // Construir mensaje del usuario con contexto
  let userMessage = message;
  if (context?.code) {
    userMessage += "\n\n## Código actual:\n";
    if (context.code.frontend) userMessage += `### Frontend:\n\`\`\`tsx\n${context.code.frontend}\n\`\`\`\n`;
    if (context.code.backend) userMessage += `### Backend:\n\`\`\`typescript\n${context.code.backend}\n\`\`\`\n`;
    if (context.code.database) userMessage += `### Database:\n\`\`\`sql\n${context.code.database}\n\`\`\`\n`;
  }
  
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: enhancedPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 4096,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[orchestrator] Agent ${agent.name} error:`, response.status, errorText);
      throw new Error(`Agent error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Detectar si el agente sugiere invocar otros
    const suggestedNextAgents: string[] = [];
    if (content.toLowerCase().includes("revisar seguridad") || content.toLowerCase().includes("validar")) {
      suggestedNextAgents.push("testing");
    }
    if (content.toLowerCase().includes("revisar licencia") || content.toLowerCase().includes("compliance")) {
      suggestedNextAgents.push("legal");
    }
    if (content.toLowerCase().includes("votación") || content.toLowerCase().includes("comunidad")) {
      suggestedNextAgents.push("governance");
    }
    
    return {
      agentId: agent.id,
      agentName: agent.display_name,
      agentRole: agent.role,
      response: content,
      processingTimeMs: Date.now() - startTime,
      suggestedNextAgents: suggestedNextAgents.length > 0 ? suggestedNextAgents : undefined,
    };
  } catch (error) {
    console.error(`[orchestrator] Error invoking ${agent.name}:`, error);
    return {
      agentId: agent.id,
      agentName: agent.display_name,
      agentRole: agent.role,
      response: `Error: No pude procesar la solicitud. ${error instanceof Error ? error.message : "Error desconocido"}`,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { sessionId, message, context, requestedAgents }: OrchestrationRequest = await req.json();
    
    console.log(`[orchestrator] New request - session: ${sessionId}, message length: ${message.length}`);
    
    // Obtener agentes activos
    const { data: agents, error: agentsError } = await supabase
      .from("ia_agents")
      .select("*")
      .eq("is_active", true)
      .order("priority");
    
    if (agentsError || !agents?.length) {
      throw new Error("No se encontraron agentes activos");
    }
    
    // Crear o recuperar sesión
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from("ia_collaborative_sessions")
        .insert({
          title: message.substring(0, 100),
          description: message,
          current_stage: "processing",
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error("[orchestrator] Error creating session:", sessionError);
      } else {
        currentSessionId = newSession.id;
      }
    }
    
    // Determinar qué agentes invocar
    let selectedAgents: Agent[];
    if (requestedAgents?.length) {
      selectedAgents = agents.filter((a: Agent) => requestedAgents.includes(a.role));
    } else {
      selectedAgents = determineAgentsToInvoke(message, context, agents);
    }
    
    console.log(`[orchestrator] Selected agents: ${selectedAgents.map(a => a.name).join(", ")}`);
    
    // Invocar agentes en secuencia (red colaborativa)
    const responses: AgentResponse[] = [];
    const additionalAgentsToInvoke = new Set<string>();
    
    for (const agent of selectedAgents) {
      const response = await invokeAgent(agent, message, context, responses, LOVABLE_API_KEY);
      responses.push(response);
      
      // Registrar colaboración
      if (currentSessionId) {
        await supabase.from("ia_agent_collaborations").insert({
          session_id: currentSessionId,
          responding_agent_id: agent.id,
          request_type: "generate",
          request_payload: { message, context },
          response_payload: response,
          status: "completed",
          processing_time_ms: response.processingTimeMs,
          completed_at: new Date().toISOString(),
        });
      }
      
      // Agregar agentes sugeridos
      if (response.suggestedNextAgents) {
        response.suggestedNextAgents.forEach(role => {
          if (!selectedAgents.some(a => a.role === role)) {
            additionalAgentsToInvoke.add(role);
          }
        });
      }
    }
    
    // Invocar agentes adicionales sugeridos (máximo 2 rondas de colaboración)
    if (additionalAgentsToInvoke.size > 0) {
      const additionalAgents = agents.filter((a: Agent) => additionalAgentsToInvoke.has(a.role));
      for (const agent of additionalAgents) {
        console.log(`[orchestrator] Additional agent invoked: ${agent.name}`);
        const response = await invokeAgent(agent, message, context, responses, LOVABLE_API_KEY);
        responses.push(response);
        
        if (currentSessionId) {
          await supabase.from("ia_agent_collaborations").insert({
            session_id: currentSessionId,
            responding_agent_id: agent.id,
            request_type: "review",
            request_payload: { message, context },
            response_payload: response,
            status: "completed",
            processing_time_ms: response.processingTimeMs,
            completed_at: new Date().toISOString(),
          });
        }
      }
    }
    
    // Actualizar sesión con agentes involucrados
    if (currentSessionId) {
      await supabase
        .from("ia_collaborative_sessions")
        .update({
          agents_involved: responses.map(r => r.agentId),
          current_stage: "completed",
          workflow_state: { responses },
        })
        .eq("id", currentSessionId);
    }
    
    // Construir respuesta unificada
    const totalProcessingTime = responses.reduce((sum, r) => sum + r.processingTimeMs, 0);
    
    console.log(`[orchestrator] Completed with ${responses.length} agent responses in ${totalProcessingTime}ms`);
    
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: currentSessionId,
        responses,
        totalAgents: responses.length,
        totalProcessingTimeMs: totalProcessingTime,
        summary: responses.length === 1 
          ? responses[0].response 
          : `## Respuesta Colaborativa de ${responses.length} Agentes\n\n` +
            responses.map(r => `### ${r.agentName}\n${r.response}`).join("\n\n"),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("[orchestrator] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
