/**
 * Returns the URL only if it is a plain http(s) link; otherwise '#'.
 * Source URLs can originate from AI-generated content stored in Firestore, so
 * `javascript:` / `data:` schemes must never reach an href attribute.
 */
export function safeUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '#';
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : '#';
  } catch {
    return '#';
  }
}
