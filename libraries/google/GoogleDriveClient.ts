import { google } from "googleapis";
import { getGoogleAuth, googleRequestTimeout, retryGoogle } from "@/libraries/google/GoogleAuth";
import { PdfError, safeGoogleError } from "@/libraries/google/PdfError";

export const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";

export function getDriveTempFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_TEMP_FOLDER_ID?.trim();
  if (!id) throw new PdfError("Google Drive temporary folder is not configured.", 503);
  return id;
}

export async function getDriveFile(fileId: string) {
  try {
    const drive = google.drive({ version: "v3", auth: getGoogleAuth() });
    const response = await retryGoogle(() => drive.files.get(
      { fileId, supportsAllDrives: true, fields: "id,name,mimeType,parents,capabilities(canCopy)" },
      { timeout: googleRequestTimeout() },
    ));
    return response.data;
  } catch (error) {
    throw safeGoogleError(error);
  }
}

export async function copyGoogleDocument(fileId: string, name: string): Promise<string> {
  try {
    const drive = google.drive({ version: "v3", auth: getGoogleAuth() });
    const response = await retryGoogle(() => drive.files.copy(
      { fileId, supportsAllDrives: true, fields: "id", requestBody: { name, parents: [getDriveTempFolderId()] } },
      { timeout: googleRequestTimeout() },
    ));
    if (!response.data.id) throw new PdfError("Google Drive did not return a copied document ID.", 502);
    return response.data.id;
  } catch (error) {
    throw safeGoogleError(error);
  }
}

export async function exportGoogleDocumentPdf(fileId: string): Promise<Buffer> {
  try {
    const drive = google.drive({ version: "v3", auth: getGoogleAuth() });
    const response = await retryGoogle(() => drive.files.export(
      { fileId, mimeType: "application/pdf" },
      { responseType: "arraybuffer", timeout: googleRequestTimeout() },
    ));
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    throw safeGoogleError(error);
  }
}

export async function deleteGoogleFile(fileId: string): Promise<void> {
  const drive = google.drive({ version: "v3", auth: getGoogleAuth() });
  try {
    await retryGoogle(() => drive.files.delete(
      { fileId, supportsAllDrives: true },
      { timeout: googleRequestTimeout() },
    ));
    return;
  } catch (deleteError) {
    // Shared Drive Content managers can trash generated files but cannot
    // permanently delete them. Keep cleanup reliable without requiring the
    // service account to hold the broader Manager role.
    try {
      await retryGoogle(() => drive.files.update(
        { fileId, supportsAllDrives: true, requestBody: { trashed: true }, fields: "id,trashed" },
        { timeout: googleRequestTimeout() },
      ));
      return;
    } catch (trashError) {
      console.error("Temporary Google document cleanup failed", {
        copiedDocumentId: fileId,
        deleteError: (deleteError as Error)?.message,
        trashError: (trashError as Error)?.message,
      });
    }
  }
}
