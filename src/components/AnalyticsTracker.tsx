/**
 * @fileoverview Global analytics tracker component.
 * Must be rendered inside BrowserRouter.
 */

import { useAnalytics } from "@/hooks/use-analytics";

export function AnalyticsTracker() {
  // Auto-tracks page views on route changes
  useAnalytics();
  return null;
}
