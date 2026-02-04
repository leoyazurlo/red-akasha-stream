import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_CONTEXT = `
## Arquitectura de Red Akasha

Red Akasha es una plataforma de streaming y comunidad para música electrónica construida con:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **Estado**: TanStack Query para cache y sincronización

### Módulos Principales:

1. **Streaming y Contenido**
   - Video On-Demand (VOD) con reproductor personalizado
   - Transmisiones en vivo con chat
   - Sistema de podcasts
   - Carruseles de contenido destacado

2. **Perfiles de Usuario**
   - Tipos: Músico, DJ, Productor, Banda, Venue, Record Label, Promotor, etc.
   - Ficha técnica personalizada por tipo
   - Sistema de seguidores
   - Galería multimedia

3. **Sistema de Foro**
   - Categorías y subforos
   - Hilos y posts con menciones (@usuario)
   - Sistema de votación y badges
   - Moderación y reportes

4. **Monetización**
   - Contenido de pago (compra/alquiler)
   - Suscripciones
   - Múltiples métodos de pago

5. **Panel de Administración**
   - Gestión de usuarios y roles
   - Curaduría de contenido
   - Configuración de streams
   - Analytics de ventas y shares
   - Sistema de badges
   - Auditoría de acciones

### Tablas Principales de la Base de Datos:
- profiles, profile_details, user_roles
- content_uploads, content_likes, content_comments, content_shares
- forum_categories, forum_subforos, forum_threads, forum_posts
- playlists, playlist_items, playback_history
- streams, donations, chat_messages
- notifications, direct_messages
- ia_authorized_users, ia_api_configs, ia_feature_proposals, ia_conversations

### Patrones de Diseño Usados:
- Componentes React pequeños y reutilizables
- Hooks personalizados para lógica de negocio
- RLS (Row Level Security) en todas las tablas
- Edge Functions para lógica de servidor
- Tokens semánticos de diseño en CSS

### Áreas de Mejora Potencial:
- Rendimiento de carga de imágenes/videos
- SEO y meta tags dinámicos
- Sistema de búsqueda avanzada
- Integración con plataformas externas (Spotify, SoundCloud)
- PWA y notificaciones push
- Sistema de mensajería en tiempo real mejorado
`;

const SYSTEM_PROMPT = `Eres Akasha IA, el asistente inteligente de la plataforma Red Akasha - una comunidad dedicada a la música electrónica, artistas, productores, DJs y la escena underground.

${PLATFORM_CONTEXT}

## Tu Rol:

1. **Analizar Solicitudes**: Cuando un usuario propone una funcionalidad:
   - Evalúa viabilidad técnica considerando la arquitectura actual
   - Identifica qué tablas/componentes se verían afectados
   - Sugiere el enfoque de implementación (frontend, backend, o ambos)
   - Estima complejidad (baja/media/alta)

2. **Proponer Mejoras**: Basándote en tu conocimiento de la plataforma:
   - Sugiere optimizaciones de UX/UI
   - Identifica posibles bugs o inconsistencias
   - Propón nuevas funcionalidades alineadas con la visión de Red Akasha

3. **Guiar Implementación**: Cuando sea apropiado:
   - Sugiere estructura de código (componentes, hooks, funciones)
   - Propón esquemas de base de datos
   - Indica políticas RLS necesarias

4. **Analizar Tendencias**: Si te comparten información del foro:
   - Identifica patrones en las solicitudes de los usuarios
   - Detecta necesidades recurrentes de la comunidad
   - Prioriza funcionalidades por impacto

## Formato de Respuesta:

Cuando propongas una funcionalidad, estructura tu respuesta así:

### 📋 Resumen
Breve descripción de la propuesta

### 🎯 Impacto
- Usuarios beneficiados
- Problema que resuelve

### 🔧 Implementación Técnica
- Componentes/archivos afectados
- Cambios en base de datos (si aplica)
- Edge functions necesarias (si aplica)

### ⚠️ Consideraciones
- Posibles desafíos
- Dependencias
- Estimación de complejidad

### 🚀 Siguiente Paso
Acción concreta para avanzar

Responde siempre en español de forma clara y estructurada.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, includeForumContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let contextMessages = [{ role: "system", content: SYSTEM_PROMPT }];

    // Si se solicita, agregar contexto del foro
    if (includeForumContext) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Obtener hilos recientes del foro
      const { data: recentThreads } = await supabase
        .from("forum_threads")
        .select("title, content, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentThreads && recentThreads.length > 0) {
        const forumSummary = recentThreads
          .map(t => `- "${t.title}": ${t.content?.slice(0, 100)}...`)
          .join("\n");

        contextMessages.push({
          role: "system",
          content: `## Contexto del Foro (últimos 20 hilos):\n${forumSummary}\n\nAnaliza estos temas para identificar necesidades de la comunidad.`
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [...contextMessages, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere agregar créditos al workspace de Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al comunicarse con la IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("akasha-ia-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});