import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// PWA service worker is auto-registered by vite-plugin-pwa

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
