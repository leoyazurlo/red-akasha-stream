/**
 * @fileoverview Sistema de analytics de producto para Red Akasha.
 * Trackea comportamiento de uso de features sin información sensible.
 * Usa batching interno para optimizar escrituras a la base de datos.
 */

import { supabase } from "@/integrations/supabase/client";

import type { Json } from "@/integrations/supabase/types";

interface AnalyticsEvent {
  event_name: string;
  properties?: Record<string, Json>;
  user_id?: string;
  session_id: string;
  page: string;
  created_at: string;
}

// ── Internal state ──

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;
const SESSION_KEY = "ra_session_id";

let queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let identifiedUserId: string | null = null;
let identifiedTraits: Record<string, Json> = {};

// ── Helpers ──

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

async function getUserId(): Promise<string | undefined> {
  if (identifiedUserId) return identifiedUserId;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? undefined;
  } catch {
    return undefined;
  }
}

async function flush(): Promise<void> {
  if (queue.length === 0) return;

  const batch = queue.splice(0, queue.length);

  if (import.meta.env.DEV) {
    // In dev, just log — don't hit DB
    batch.forEach((e) =>
      console.log(
        `📊 [${e.event_name}]`,
        e.properties ?? "",
        `| page: ${e.page}`
      )
    );
    return;
  }

  try {
    const { error } = await supabase.from("analytics_events").insert(
      batch.map((e) => ({
        event_name: e.event_name,
        properties: (e.properties ?? {}) as Json,
        user_id: e.user_id ?? null,
        session_id: e.session_id,
        page: e.page,
        created_at: e.created_at,
      }))
    );
    if (error) {
      console.warn("[analytics] flush error:", error.message);
      // Re-queue failed events (limit to avoid infinite growth)
      if (queue.length < 100) {
        queue.push(...batch);
      }
    }
  } catch (err) {
    console.warn("[analytics] flush exception:", err);
  }
}

function ensureFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flush();
  }, FLUSH_INTERVAL_MS);

  // Flush on page unload
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => flush());
  }
}

// ── Public API ──

/**
 * Track a product analytics event.
 * In development: logs to console.
 * In production: queues and batches to Supabase.
 */
export async function track(
  eventName: string,
  properties?: Record<string, Json>
): Promise<void> {
  const userId = await getUserId();

  const event: AnalyticsEvent = {
    event_name: eventName,
    properties: {
      ...identifiedTraits,
      ...properties,
    },
    user_id: userId,
    session_id: getSessionId(),
    page: window.location.pathname,
    created_at: new Date().toISOString(),
  };

  queue.push(event);
  ensureFlushTimer();

  if (queue.length >= BATCH_SIZE) {
    flush();
  }
}

/**
 * Track a page view event.
 */
export function page(pageName: string): void {
  track("page_view", { page_name: pageName });
}

/**
 * Identify the current user for future events.
 */
export function identify(
  userId: string,
  traits?: Record<string, Json>
): void {
  identifiedUserId = userId;
  if (traits) {
    identifiedTraits = { ...identifiedTraits, ...traits };
  }
}

/**
 * Predefined event helpers for key flows.
 */
export const AnalyticsEvents = {
  streamStarted: (streamId?: string) =>
    track("stream_started", { stream_id: streamId }),
  streamEnded: (streamId?: string, durationMs?: number) =>
    track("stream_ended", { stream_id: streamId, duration_ms: durationMs }),
  artistProfileViewed: (artistId: string) =>
    track("artist_profile_viewed", { artist_id: artistId }),
  studioOpened: () => track("studio_opened"),
  mapOpened: () => track("map_opened"),
  userSignedUp: () => track("user_signed_up"),
  userLoggedIn: () => track("user_logged_in"),
  contentShared: (contentId: string, platform: string) =>
    track("content_shared", { content_id: contentId, platform }),
} as const;
