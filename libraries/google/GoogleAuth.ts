import { google } from "googleapis";
import { PdfError } from "@/libraries/google/PdfError";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/documents",
];

let auth: InstanceType<typeof google.auth.GoogleAuth> | null = null;

export function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!clientEmail || !privateKey) {
    throw new PdfError("Google PDF service credentials are not configured.", 503);
  }
  auth ??= new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: privateKey }, scopes: SCOPES });
  return auth;
}

export function googleRequestTimeout(): number {
  const parsed = Number(process.env.PDF_GENERATION_TIMEOUT_MS ?? 30000);
  return Number.isFinite(parsed) && parsed >= 1000 ? parsed : 30000;
}

export async function retryGoogle<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await operation(); }
    catch (error) {
      last = error;
      const status = Number((error as any)?.code ?? (error as any)?.response?.status ?? 0);
      if (attempt === attempts - 1 || (status !== 429 && status < 500)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 200 * (2 ** attempt)));
    }
  }
  throw last;
}
