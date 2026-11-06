import { HttpsError, CallableRequest } from "firebase-functions/v2/https";

/**
 * Best-effort per-IP sliding-window rate limiter (in-memory, per instance).
 * Combined with a low `maxInstances` cap on each function this bounds the
 * Gemini spend an anonymous caller can cause.
 */
const hits = new Map<string, number[]>();

export function enforceRateLimit(
  request: CallableRequest<any>,
  bucket: string,
  maxCalls: number,
  windowMs: number
): void {
  const fwd = request.rawRequest?.headers?.["x-forwarded-for"];
  const ip =
    (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") ||
    request.rawRequest?.ip ||
    "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= maxCalls) {
    throw new HttpsError("resource-exhausted", "Too many requests. Please try again shortly.");
  }
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup to keep memory bounded
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    }
  }
}

export const ALLOWED_ORIGINS = [
  "https://uk-policy-tracker-live.web.app",
  "https://uk-policy-tracker-live.firebaseapp.com",
  "http://localhost:5173",
];

/** Clamp an untrusted string from model output. */
export function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/** Only allow http(s) URLs through from model output. */
export function safeHttpUrl(v: unknown): string {
  if (typeof v !== "string") return "";
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 500) : "";
  } catch {
    return "";
  }
}
