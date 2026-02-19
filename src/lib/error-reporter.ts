/**
 * @fileoverview Sistema de reporte de errores para Red Akasha.
 * Captura errores del frontend y los persiste en la tabla error_logs.
 * En dev solo logea a consola; en producción escribe a la DB.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const SESSION_KEY = "ra_session_id";

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

interface ErrorReport {
  message: string;
  stack?: string;
  type?: "uncaught" | "boundary" | "edge_function" | "api";
  severity?: "warning" | "error" | "critical";
  component?: string;
  metadata?: Record<string, Json>;
}

/**
 * Report an error to the monitoring system.
 * In dev: logs to console. In prod: writes to error_logs table.
 */
export async function reportError(report: ErrorReport): Promise<void> {
  const entry = {
    error_message: report.message,
    error_stack: report.stack ?? null,
    error_type: report.type ?? "uncaught",
    severity: report.severity ?? "error",
    component: report.component ?? null,
    page: window.location.pathname,
    session_id: getSessionId(),
    metadata: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ...report.metadata,
    } as Json,
  };

  if (import.meta.env.DEV) {
    console.error(`🔴 [ErrorReporter] [${entry.severity}] ${entry.error_message}`, entry);
    return;
  }

  try {
    // Get user id if available (don't block on auth)
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;

    await supabase.from("error_logs").insert({
      ...entry,
      user_id: userId,
    });
  } catch (e) {
    // Fallback: don't let error reporting cause more errors
    console.error("[ErrorReporter] Failed to report:", e);
  }
}

/**
 * Install global error handlers for uncaught errors and unhandled rejections.
 * Call once at app startup.
 */
export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    reportError({
      message: event.message || "Unknown error",
      stack: event.error?.stack,
      type: "uncaught",
      severity: "critical",
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;
    reportError({
      message: error?.message || String(error) || "Unhandled promise rejection",
      stack: error?.stack,
      type: "uncaught",
      severity: "critical",
      metadata: { type: "unhandledrejection" },
    });
  });
}
