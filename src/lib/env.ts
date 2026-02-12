/**
 * @fileoverview Centralised, validated environment variables for Red Akasha.
 * Import from here instead of using `import.meta.env` directly.
 */

function requireEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined;

  if (!value) {
    if (import.meta.env.PROD) {
      throw new Error(`[env] Variable de entorno requerida no encontrada: ${name}`);
    }
    console.warn(`⚠️ [env] Variable no configurada: ${name}`);
    return "";
  }

  return value;
}

/** Supabase project URL */
export const SUPABASE_URL = requireEnv("VITE_SUPABASE_URL");

/** Supabase publishable (anon) key */
export const SUPABASE_ANON_KEY = requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

/** Supabase project ID (used for edge-function URLs, etc.) */
export const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

// Dev-only: log which env vars are present (never log values)
if (import.meta.env.DEV) {
  const vars = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PROJECT_ID",
  ];
  console.log(
    "🔐 [env] Variables configuradas:",
    vars.filter((v) => !!import.meta.env[v]).join(", ") || "ninguna",
  );
}
