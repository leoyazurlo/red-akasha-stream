/**
 * @fileoverview Hook de analytics para Red Akasha.
 * Expone funciones de tracking y auto-trackea page views en cambios de ruta.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { track, page, identify, AnalyticsEvents } from "@/lib/analytics";

/**
 * Hook que expone el sistema de analytics y auto-trackea page views.
 *
 * @example
 * ```tsx
 * const { trackEvent } = useAnalytics();
 * trackEvent("button_clicked", { button: "subscribe" });
 * ```
 */
export function useAnalytics() {
  const location = useLocation();
  const lastPath = useRef<string>("");

  // Auto-track page views on route changes
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      page(location.pathname);
    }
  }, [location.pathname]);

  return {
    trackEvent: track,
    trackPageView: () => page(location.pathname),
    identify,
    events: AnalyticsEvents,
  };
}
