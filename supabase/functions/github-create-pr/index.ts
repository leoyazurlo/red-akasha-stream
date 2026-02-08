import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreatePRRequest {
  proposalId: string;
  title: string;
  description: string;
  frontendCode: string;
  backendCode: string;
  databaseCode: string;
  targetBranch?: string;
}

interface FileChange {
  path: string;
  content: string;
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

    // Create client for auth verification
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });

    // Verify ADMIN authentication - REQUIRED for this endpoint
    const auth = await verifyAdminAuth(req, authClient);
    
    if (!auth) {
      console.log("[github-create-pr] Unauthorized request - admin access required");
      return new Response(
        JSON.stringify({ error: "Acceso denegado. Se requiere rol de administrador." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get GitHub config from database first
    const { data: configData } = await supabase
      .from("platform_payment_settings")
      .select("setting_value")
      .eq("setting_key", "github_config")
      .single();

    let GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    let GITHUB_REPO = Deno.env.get("GITHUB_REPO");
    let TARGET_BRANCH = "main";

    // Use database config if available
    if (configData?.setting_value) {
      const dbConfig = configData.setting_value as Record<string, any>;
      if (dbConfig.github_enabled) {
        GITHUB_TOKEN = dbConfig.github_token || GITHUB_TOKEN;
        GITHUB_REPO = dbConfig.github_repo || GITHUB_REPO;
        TARGET_BRANCH = dbConfig.github_branch || TARGET_BRANCH;
      } else {
        throw new Error("La integración de GitHub está deshabilitada. Habilítala en Configuración → GitHub");
      }
    }
    
    if (!GITHUB_TOKEN) {
      throw new Error("Token de GitHub no configurado. Ve a Configuración → GitHub en el panel de administración.");
    }
    
    if (!GITHUB_REPO) {
      throw new Error("Repositorio de GitHub no configurado. Formato: owner/repo");
    }

    // Validate repo format
    if (!GITHUB_REPO.includes("/")) {
      throw new Error(`Formato de repositorio inválido: "${GITHUB_REPO}". Debe ser "owner/repo"`);
    }

    const { 
      proposalId, 
      title, 
      description, 
      frontendCode, 
      backendCode, 
      databaseCode,
      targetBranch = TARGET_BRANCH 
    }: CreatePRRequest = await req.json();

    const branchName = `akasha-ia/${proposalId.slice(0, 8)}-${title.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`;
    
    console.log(`[github-create-pr] Admin ${auth.userId} creating PR for proposal ${proposalId}`);
    console.log(`[github-create-pr] Repo: ${GITHUB_REPO}, Branch: ${branchName}, Target: ${targetBranch}`);

    // Step 0: Verify token has access to the repository
    const repoCheckResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!repoCheckResponse.ok) {
      const repoError = await repoCheckResponse.text();
      console.error("[github-create-pr] Error accessing repo:", repoError);
      if (repoCheckResponse.status === 404) {
        throw new Error(`No se puede acceder al repositorio "${GITHUB_REPO}". Verifica que el token tenga permisos y el repositorio exista.`);
      } else if (repoCheckResponse.status === 401) {
        throw new Error("Token de GitHub inválido o expirado. Genera un nuevo token.");
      }
      throw new Error(`Error al verificar repositorio: ${repoCheckResponse.status}`);
    }

    const repoData = await repoCheckResponse.json();
    const defaultBranch = repoData.default_branch || "main";
    const actualTargetBranch = targetBranch === "main" ? defaultBranch : targetBranch;

    console.log(`[github-create-pr] Repo verified. Default branch: ${defaultBranch}, Using: ${actualTargetBranch}`);

    // Step 1: Get the latest commit SHA from target branch
    const refResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${actualTargetBranch}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!refResponse.ok) {
      const error = await refResponse.text();
      console.error("[github-create-pr] Error getting ref:", error);
      throw new Error(`No se pudo obtener la referencia del branch "${actualTargetBranch}". ¿Existe este branch en el repositorio?`);
    }

    const refData = await refResponse.json();
    const baseSha = refData.object.sha;

    // Step 2: Get the base tree
    const baseTreeResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/git/commits/${baseSha}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    const baseTreeData = await baseTreeResponse.json();
    const baseTreeSha = baseTreeData.tree.sha;

    // Step 3: Prepare file changes
    const files: FileChange[] = [];
    const timestamp = new Date().toISOString().split("T")[0];
    
    // Parse frontend code to extract component files
    if (frontendCode && frontendCode !== "// No se generó código frontend") {
      const componentMatch = frontendCode.match(/\/\/ (src\/[^\n]+)/);
      const componentPath = componentMatch ? componentMatch[1] : `src/components/generated/Proposal_${proposalId.slice(0, 8)}.tsx`;
      files.push({ path: componentPath, content: frontendCode });
    }

    // Parse backend code to extract edge function
    if (backendCode && backendCode !== "// No se generó código backend") {
      const functionMatch = backendCode.match(/\/\/ (supabase\/functions\/[^\n]+)/);
      const functionPath = functionMatch ? functionMatch[1] : `supabase/functions/generated-${proposalId.slice(0, 8)}/index.ts`;
      files.push({ path: functionPath, content: backendCode });
    }

    // Add migration file for database code
    if (databaseCode && databaseCode !== "-- No se generó código de base de datos") {
      const migrationPath = `supabase/migrations/${timestamp}_proposal_${proposalId.slice(0, 8)}.sql`;
      files.push({ path: migrationPath, content: databaseCode });
    }

    if (files.length === 0) {
      throw new Error("No hay archivos para crear el PR");
    }

    // Step 4: Create blobs for each file
    const treeItems = [];
    for (const file of files) {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/git/blobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: file.content,
            encoding: "utf-8",
          }),
        }
      );

      if (!blobResponse.ok) {
        const error = await blobResponse.text();
        console.error(`[github-create-pr] Error creating blob for ${file.path}:`, error);
        continue;
      }

      const blobData = await blobResponse.json();
      treeItems.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      });
    }

    // Step 5: Create new tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/git/trees`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      }
    );

    if (!treeResponse.ok) {
      const error = await treeResponse.text();
      console.error("[github-create-pr] Error creating tree:", error);
      throw new Error("No se pudo crear el árbol de archivos");
    }

    const treeData = await treeResponse.json();

    // Step 6: Create commit
    const commitMessage = `feat(akasha-ia): ${title}

${description}

Propuesta ID: ${proposalId}
Generado automáticamente por Akasha IA
Aprobado por: ${auth.userId}

Archivos modificados:
${files.map(f => `- ${f.path}`).join("\n")}`;

    const commitResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/git/commits`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [baseSha],
        }),
      }
    );

    if (!commitResponse.ok) {
      const error = await commitResponse.text();
      console.error("[github-create-pr] Error creating commit:", error);
      throw new Error("No se pudo crear el commit");
    }

    const commitData = await commitResponse.json();

    // Step 7: Create new branch
    const createBranchResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/git/refs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: commitData.sha,
        }),
      }
    );

    if (!createBranchResponse.ok) {
      const error = await createBranchResponse.text();
      // Branch might already exist, try to update it
      if (createBranchResponse.status === 422) {
        const updateResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${branchName}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sha: commitData.sha,
              force: true,
            }),
          }
        );
        if (!updateResponse.ok) {
          console.error("[github-create-pr] Error updating branch:", error);
          throw new Error("No se pudo actualizar el branch");
        }
      } else {
        console.error("[github-create-pr] Error creating branch:", error);
        throw new Error("No se pudo crear el branch");
      }
    }

    // Step 8: Create Pull Request
    const prBody = `## 🚀 Propuesta de Akasha IA

### Descripción
${description}

### Archivos incluidos
${files.map(f => `- \`${f.path}\``).join("\n")}

### Instrucciones
1. Revisa los cambios propuestos
2. Si hay migraciones SQL, revísalas cuidadosamente
3. Aprueba y merge cuando estés listo

---
*Generado automáticamente por Akasha IA*
*Propuesta ID: ${proposalId}*
*Aprobado por Admin: ${auth.userId}*`;

    const prResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `[Akasha IA] ${title}`,
          body: prBody,
          head: branchName,
          base: targetBranch,
        }),
      }
    );

    if (!prResponse.ok) {
      const error = await prResponse.text();
      console.error("[github-create-pr] Error creating PR:", error);
      
      // PR might already exist
      if (prResponse.status === 422) {
        // Get existing PR
        const existingPRResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/pulls?head=${GITHUB_REPO.split("/")[0]}:${branchName}&state=open`,
          {
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
        const existingPRs = await existingPRResponse.json();
        if (existingPRs.length > 0) {
          const pr = existingPRs[0];
          // Update proposal with PR info
          await supabase
            .from("ia_feature_proposals")
            .update({ 
              status: "reviewing",
              review_notes: `PR actualizado: ${pr.html_url}`,
            })
            .eq("id", proposalId);

          return new Response(
            JSON.stringify({
              success: true,
              prUrl: pr.html_url,
              prNumber: pr.number,
              message: "PR existente actualizado con nuevos cambios",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      throw new Error("No se pudo crear el Pull Request");
    }

    const prData = await prResponse.json();

    // Update proposal with PR info
    await supabase
      .from("ia_feature_proposals")
      .update({ 
        status: "reviewing",
        review_notes: `PR creado: ${prData.html_url}`,
      })
      .eq("id", proposalId);

    console.log(`[github-create-pr] PR created successfully by admin ${auth.userId}: ${prData.html_url}`);

    return new Response(
      JSON.stringify({
        success: true,
        prUrl: prData.html_url,
        prNumber: prData.number,
        branch: branchName,
        files: files.map(f => f.path),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[github-create-pr] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
