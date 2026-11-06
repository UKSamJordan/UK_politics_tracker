"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_ORIGINS = void 0;
exports.enforceRateLimit = enforceRateLimit;
exports.str = str;
exports.safeHttpUrl = safeHttpUrl;
const https_1 = require("firebase-functions/v2/https");
/**
 * Best-effort per-IP sliding-window rate limiter (in-memory, per instance).
 * Combined with a low `maxInstances` cap on each function this bounds the
 * Gemini spend an anonymous caller can cause.
 */
const hits = new Map();
function enforceRateLimit(request, bucket, maxCalls, windowMs) {
    var _a, _b, _c;
    const fwd = (_b = (_a = request.rawRequest) === null || _a === void 0 ? void 0 : _a.headers) === null || _b === void 0 ? void 0 : _b["x-forwarded-for"];
    const ip = (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") ||
        ((_c = request.rawRequest) === null || _c === void 0 ? void 0 : _c.ip) ||
        "unknown";
    const key = `${bucket}:${ip}`;
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= maxCalls) {
        throw new https_1.HttpsError("resource-exhausted", "Too many requests. Please try again shortly.");
    }
    recent.push(now);
    hits.set(key, recent);
    // Opportunistic cleanup to keep memory bounded
    if (hits.size > 5000) {
        for (const [k, v] of hits) {
            if (!v.some((t) => now - t < windowMs))
                hits.delete(k);
        }
    }
}
exports.ALLOWED_ORIGINS = [
    "https://uk-policy-tracker-live.web.app",
    "https://uk-policy-tracker-live.firebaseapp.com",
    "http://localhost:5173",
];
/** Clamp an untrusted string from model output. */
function str(v, max) {
    return typeof v === "string" ? v.slice(0, max) : "";
}
/** Only allow http(s) URLs through from model output. */
function safeHttpUrl(v) {
    if (typeof v !== "string")
        return "";
    try {
        const u = new URL(v.trim());
        return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 500) : "";
    }
    catch (_a) {
        return "";
    }
}
//# sourceMappingURL=security.js.map