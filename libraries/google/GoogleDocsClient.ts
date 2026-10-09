import { google } from "googleapis";
import { getGoogleAuth, googleRequestTimeout, retryGoogle } from "@/libraries/google/GoogleAuth";
import { safeGoogleError } from "@/libraries/google/PdfError";

export async function getGoogleDocument(documentId: string) {
  try {
    const docs = google.docs({ version: "v1", auth: getGoogleAuth() });
    return (await retryGoogle(() => docs.documents.get({ documentId }, { timeout: googleRequestTimeout() }))).data;
  } catch (error) {
    throw safeGoogleError(error);
  }
}

export async function batchUpdateGoogleDocument(documentId: string, requests: any[]): Promise<void> {
  if (requests.length === 0) return;
  try {
    const docs = google.docs({ version: "v1", auth: getGoogleAuth() });
    await retryGoogle(() => docs.documents.batchUpdate({ documentId, requestBody: { requests } }, { timeout: googleRequestTimeout() }));
  } catch (error) {
    throw safeGoogleError(error);
  }
}
