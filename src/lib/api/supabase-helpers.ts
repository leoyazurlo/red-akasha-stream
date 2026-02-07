/**
 * @fileoverview Funciones auxiliares para interactuar con Supabase.
 * Proporciona helpers tipados y manejo de errores centralizado.
 */

import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

/** Resultado de una operación de autenticación */
export interface AuthResult {
  user: User | null;
  session: Session | null;
  error?: string;
}

/**
 * Obtiene la sesión actual del usuario
 * @returns Sesión activa o null
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Obtiene el usuario actual autenticado
 * @returns Usuario o null si no está autenticado
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Obtiene el token de acceso de la sesión actual
 * @throws Error si no hay sesión activa
 * @returns Token de acceso JWT
 */
export async function getAccessToken(): Promise<string> {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error("No hay sesión activa");
  }
  return session.access_token;
}

/**
 * Verifica si el usuario tiene rol de administrador
 * @param userId - ID del usuario a verificar
 * @returns true si es administrador
 */
export async function checkAdminRole(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .single();
  
  return !!data;
}

/**
 * Verifica si un usuario está autorizado para usar Akasha IA
 * @param userId - ID del usuario a verificar
 * @returns true si está autorizado
 */
export async function checkIAAuthorization(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("ia_authorized_users")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();
  
  return !!data;
}

/**
 * Invoca una Edge Function con manejo de errores
 * @param functionName - Nombre de la función a invocar
 * @param body - Cuerpo de la petición
 * @returns Datos de la respuesta
 * @throws Error con mensaje descriptivo
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  
  if (error) {
    console.error(`[${functionName}] Error:`, error);
    throw new Error(error.message || `Error al invocar ${functionName}`);
  }
  
  return data as T;
}

/**
 * Formatea un mensaje de error para mostrar al usuario
 * @param error - Error capturado
 * @param fallback - Mensaje por defecto
 * @returns Mensaje de error legible
 */
export function formatErrorMessage(error: unknown, fallback = "Error desconocido"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}
