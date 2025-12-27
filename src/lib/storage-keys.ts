/**
 * Helpers for generating safe storage object keys.
 *
 * Some storage providers reject object keys containing certain unicode characters
 * (e.g. combining marks) or other special characters.
 */

export function sanitizeStorageFileName(input: string): string {
  // Prevent path traversal / nested paths coming from the user.
  const baseName = (input || "file").split("/").pop() || "file";

  // Remove diacritics / combining marks (e.g. "dançar" -> "dancar").
  const noDiacritics = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const safe = noDiacritics
    .trim()
    .replace(/\s+/g, "-")
    // Keep only URL-safe characters.
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    // Avoid leading dots which can cause odd behavior.
    .replace(/^\.+/, "")
    .slice(0, 140);

  return safe || "file";
}

export function buildProfileObjectPath(profileId: string, originalFileName: string): string {
  const safeName = sanitizeStorageFileName(originalFileName);
  return `${profileId}/${Date.now()}-${safeName}`;
}

function isRetryableUploadError(err: any): boolean {
  const status = err?.status ?? err?.statusCode;
  const msg = String(err?.message || "");

  // 5xx / transient gateway issues (often returns HTML, causing JSON.parse errors in the SDK)
  if ([429, 500, 502, 503, 504].includes(Number(status))) return true;
  if (msg.includes("JSON.parse")) return true;
  if (msg.toLowerCase().includes("gateway")) return true;
  if (msg.toLowerCase().includes("time-out") || msg.toLowerCase().includes("timeout")) return true;
  if (msg.toLowerCase().includes("failed to fetch")) return true;

  return false;
}

export async function uploadWithRetry<T>(
  fn: () => Promise<{ data: T | null; error: any }>,
  retries = 2
): Promise<{ data: T | null; error: any }> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await fn();
    if (!result.error) return result;

    if (attempt >= retries || !isRetryableUploadError(result.error)) {
      return result;
    }

    // small backoff
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    attempt++;
  }
}
