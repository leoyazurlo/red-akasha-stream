/**
 * @fileoverview Reporte de Web Vitals para Red Akasha.
 * En producción: persiste métricas LCP, CLS, INP, FCP, TTFB en performance_metrics.
 * En dev: solo logea a consola (ya existente en main.tsx).
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

function getRating(name: string, value: number): "good" | "needs-improvement" | "poor" {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FCP: [1800, 3000],
    CLS: [0.1, 0.25],
    INP: [200, 500],
    TTFB: [800, 1800],
    FID: [100, 300],
  };
  const t = thresholds[name];
  if (!t) return "good";
  if (value <= t[0]) return "good";
  if (value <= t[1]) return "needs-improvement";
  return "poor";
}

async function reportMetric(
  name: string,
  value: number,
  metadata?: Record<string, Json>
): Promise<void> {
  if (import.meta.env.DEV) {
    console.log(`🎯 [${name}]: ${value.toFixed(2)} (${getRating(name, value)})`);
    return;
  }

  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from("performance_metrics").insert([{
      metric_name: name,
      metric_value: value,
      rating: getRating(name, value),
      page: window.location.pathname,
      user_id: data.user?.id ?? null,
      session_id: getSessionId(),
      metadata: metadata ?? {},
    }]);
  } catch (e) {
    console.warn("[PerfReporter] Failed:", e);
  }
}

/**
 * Install Web Vitals observers. Call once at app startup.
 * Uses native PerformanceObserver API (no external deps).
 */
export function installWebVitalsReporter(): void {
  if (typeof window === "undefined") return;
  // Skip in dev — main.tsx already handles dev logging
  if (import.meta.env.DEV) return;

  // LCP
  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      reportMetric("LCP", last.startTime, { element: (last as any).element?.tagName });
    });
    lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
  } catch { /* not supported */ }

  // CLS
  try {
    let clsValue = 0;
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });
    clsObs.observe({ type: "layout-shift", buffered: true });
    // Report CLS on page hide
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        reportMetric("CLS", clsValue);
      }
    });
  } catch { /* not supported */ }

  // FID / INP
  try {
    const fidObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const first = entries[0] as PerformanceEventTiming;
        reportMetric("FID", first.processingStart - first.startTime);
      }
    });
    fidObs.observe({ type: "first-input", buffered: true });
  } catch { /* not supported */ }

  // FCP
  try {
    const fcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find((e) => e.name === "first-contentful-paint");
      if (fcp) reportMetric("FCP", fcp.startTime);
    });
    fcpObs.observe({ type: "paint", buffered: true });
  } catch { /* not supported */ }

  // TTFB
  try {
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const nav = navEntries[0];
      reportMetric("TTFB", nav.responseStart - nav.requestStart, {
        navigationType: nav.type,
      });
    }
  } catch { /* not supported */ }
}
