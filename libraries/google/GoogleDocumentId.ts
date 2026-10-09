import BadParameterException from "@/exceptions/BadParameterException";

const ID_RE = /^[A-Za-z0-9_-]{20,200}$/;

export function normalizeGoogleDocumentId(value: string): string {
  const trimmed = value.trim();
  if (ID_RE.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.hostname !== "docs.google.com") throw new Error("invalid");
    const match = url.pathname.match(/^\/document\/d\/([A-Za-z0-9_-]{20,200})(?:\/.*)?$/);
    if (!match || !ID_RE.test(match[1])) throw new Error("invalid");
    return match[1];
  } catch {
    throw new BadParameterException("Google document must be a valid Docs URL or document ID.");
  }
}
