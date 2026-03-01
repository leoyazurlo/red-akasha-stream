import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { installGlobalErrorHandlers } from "./lib/error-reporter";
import { installWebVitalsReporter } from "./lib/performance-reporter";

// Install monitoring
installGlobalErrorHandlers();
installWebVitalsReporter();

// One-time purge of legacy Service Worker & caches to prevent black screen
(async () => {
  const PURGE_KEY = 'akasha_legacy_purged_v3';
  if (!('serviceWorker' in navigator) || localStorage.getItem(PURGE_KEY)) return;

  try {
    const cacheNames = await caches.keys();
    const hasLegacyCaches = cacheNames.some((n) => n.startsWith('akasha-'));

    const registrations = await navigator.serviceWorker.getRegistrations();
    const legacySW = registrations.find((r) =>
      r.active?.scriptURL?.endsWith('/sw.js')
    );

    if (!hasLegacyCaches && !legacySW) {
      // No legacy footprint – mark done, no reload needed
      localStorage.setItem(PURGE_KEY, Date.now().toString());
      return;
    }

    // Purge legacy caches
    await Promise.all(
      cacheNames
        .filter((n) => n.startsWith('akasha-'))
        .map((n) => caches.delete(n))
    );

    // Unregister only the legacy /sw.js worker
    if (legacySW) await legacySW.unregister();

    localStorage.setItem(PURGE_KEY, Date.now().toString());
    console.log('[App] Legacy SW & caches purged, reloading once…');
    window.location.reload();
  } catch (e) {
    console.warn('[App] Legacy purge failed:', e);
    // Mark as done anyway to avoid retry loops
    localStorage.setItem(PURGE_KEY, 'error');
  }
})();

// Web Vitals reporting (dev only)
if (import.meta.env.DEV) {
  // LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      console.log(`🎯 [LCP]: ${last.startTime.toFixed(1)} ms`);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // not supported
  }

  // CLS
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      console.log(`🎯 [CLS]: ${clsValue.toFixed(4)}`);
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // not supported
  }

  // FID
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const first = entries[0] as PerformanceEventTiming;
        console.log(`🎯 [FID]: ${first.processingStart - first.startTime} ms`);
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // not supported
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
