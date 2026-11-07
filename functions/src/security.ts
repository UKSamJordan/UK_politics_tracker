import { HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

/**
 * Best-effort per-IP sliding-window rate limiter (in-memory, per instance).
 * Combined with a low `maxInstances` cap on each function this bounds the
 * Gemini spend an anonymous caller can cause.
 */
const hits = new Map<string, number[]>();

export function getCallerIp(request: CallableRequest<any>): string {
  const fwd = request.rawRequest?.headers?.["x-forwarded-for"];
  return (
    (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") ||
    request.rawRequest?.ip ||
    "unknown"
  );
}

export function enforceRateLimit(
  request: CallableRequest<any>,
  bucket: string,
  maxCalls: number,
  windowMs: number
): void {
  const ip = getCallerIp(request);
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

/**
 * Persistent cross-instance rate limiter backed by Firestore `_internal_ratelimits`
 * using one-way SHA-256 IP hashes so cold starts or multiple Cloud Run instances
 * still enforce per-IP caps without storing raw IP addresses.
 */
export async function enforceSharedRateLimit(
  db: admin.firestore.Firestore,
  request: CallableRequest<any>,
  bucket: string,
  maxCallsPerIp: number,
  windowMs: number
): Promise<void> {
  // Fast in-memory check first
  enforceRateLimit(request, bucket, maxCallsPerIp, windowMs);

  const rawIp = getCallerIp(request);
  const ipHash = crypto
    .createHash("sha256")
    .update(`uk-pol-rl:${bucket}:${rawIp}`)
    .digest("hex")
    .slice(0, 24);
  const docRef = db.collection("_internal_ratelimits").doc(`bucket_${bucket}`);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = snap.exists ? snap.data() || {} : {};
    const ipMap: Record<string, number[]> = data.ipHits || {};

    const recentIp = (Array.isArray(ipMap[ipHash]) ? ipMap[ipHash] : []).filter(
      (t: number) => typeof t === "number" && now - t < windowMs
    );

    if (recentIp.length >= maxCallsPerIp) {
      throw new HttpsError("resource-exhausted", "Too many requests. Please try again shortly.");
    }

    recentIp.push(now);
    ipMap[ipHash] = recentIp;

    // Prune expired IP entries so the document stays compact
    const prunedIpMap: Record<string, number[]> = {};
    for (const [k, arr] of Object.entries(ipMap)) {
      if (Array.isArray(arr)) {
        const active = arr.filter((t) => typeof t === "number" && now - t < windowMs);
        if (active.length > 0) {
          prunedIpMap[k] = active;
        }
      }
    }

    tx.set(docRef, { ipHits: prunedIpMap, updatedAt: now }, { merge: false });
  });
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

/**
 * Sanitize untrusted RSS feed titles/snippets before passing to Gemini
 * to mitigate indirect prompt injection from external news feeds.
 */
export function sanitizeRssText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(
      /\b(ignore\s+(all\s+|previous\s+|prior\s+|above\s+)?(instructions|prompts|rules)|system\s*prompt|new\s*instructions|disregard\s+previous)\b/gi,
      "[filtered]"
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
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

