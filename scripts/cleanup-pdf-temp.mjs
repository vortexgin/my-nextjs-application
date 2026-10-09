import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

const cutoff = Date.now() - 60 * 60 * 1000;
const directory = path.resolve(process.env.PDF_TEMP_DIRECTORY ?? "/tmp/vortexgin-pdf");

async function cleanupLocal() {
  let names = [];
  try { names = await readdir(directory); } catch (error) { if (error?.code === "ENOENT") return; throw error; }
  for (const name of names) {
    if (!/^[0-9a-f-]{36}\.pdf$/i.test(name)) continue;
    const file = path.join(directory, name);
    const info = await stat(file);
    if (info.isFile() && info.mtimeMs < cutoff) await unlink(file);
  }
}

async function cleanupDrive() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const folderId = process.env.GOOGLE_DRIVE_TEMP_FOLDER_ID?.trim();
  if (!clientEmail || !privateKey || !folderId) throw new Error("Google PDF cleanup configuration is incomplete.");
  const auth = new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: privateKey }, scopes: ["https://www.googleapis.com/auth/drive"] });
  const drive = google.drive({ version: "v3", auth });
  let pageToken;
  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and name contains 'vortexgin-'`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: "nextPageToken,files(id,name,createdTime)",
      pageToken,
    });
    for (const file of response.data.files ?? []) {
      if (file.id && file.createdTime && new Date(file.createdTime).getTime() < cutoff && file.name?.startsWith("vortexgin-")) {
        try {
          await drive.files.delete({ fileId: file.id, supportsAllDrives: true });
        } catch (error) {
          const status = Number(error?.code ?? error?.response?.status ?? 0);
          if (status !== 403 && status !== 404) throw error;
          await drive.files.update({ fileId: file.id, supportsAllDrives: true, requestBody: { trashed: true } });
        }
      }
    }
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);
}

await cleanupLocal();
await cleanupDrive();
console.log("Temporary PDF cleanup completed.");
