import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { DocumentType } from "@/app/base/models/DocumentTemplateModel";
import { copyGoogleDocument, deleteGoogleFile, exportGoogleDocumentPdf } from "@/libraries/google/GoogleDriveClient";
import { renderGoogleDocument, type PdfParameters } from "@/libraries/google/GoogleDocsTemplateRenderer";
import { PdfError } from "@/libraries/google/PdfError";

export type GeneratedPdf = { filename: string; content_type: "application/pdf"; size: number; data_base64: string; output: "download" | "print"; generated_at: string };

export function sanitizePdfFilename(value: string): string {
  const safe = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
  return `${safe || "document"}.pdf`;
}

function maxPdfBytes(): number {
  const value = Number(process.env.PDF_MAX_BYTES ?? 10485760);
  return Number.isFinite(value) && value > 0 ? value : 10485760;
}

export async function generateGoogleDocsPdf(input: {
  templateId: string;
  documentType: DocumentType;
  parameters: PdfParameters;
  filenameBase: string;
  output: "download" | "print";
}): Promise<GeneratedPdf> {
  const id = randomUUID();
  const filename = sanitizePdfFilename(input.filenameBase);
  const tempDirectory = path.resolve(/* turbopackIgnore: true */ process.env.PDF_TEMP_DIRECTORY ?? "/tmp/vortexgin-pdf");
  const localPath = path.join(tempDirectory, `${id}.pdf`);
  let copiedDocumentId: string | null = null;
  let pdf: Buffer;

  try {
    try {
      copiedDocumentId = await copyGoogleDocument(input.templateId, `vortexgin-${input.documentType}-${id}`);
      await renderGoogleDocument(copiedDocumentId, input.documentType, input.parameters);
      pdf = await exportGoogleDocumentPdf(copiedDocumentId);
    } catch (error) {
      if (error instanceof PdfError) throw error;
      throw new PdfError("PDF template rendering failed.", 500);
    }
  } finally {
    if (copiedDocumentId) await deleteGoogleFile(copiedDocumentId);
  }

  await mkdir(tempDirectory, { recursive: true, mode: 0o700 });
  try {
    await writeFile(localPath, pdf, { mode: 0o600 });
    const bytes = await readFile(localPath);
    if (bytes.length > maxPdfBytes()) throw new PdfError("Generated PDF exceeds the configured size limit.", 413);
    return {
      filename,
      content_type: "application/pdf",
      size: bytes.length,
      data_base64: bytes.toString("base64"),
      output: input.output,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof PdfError) throw error;
    throw new PdfError("Temporary PDF processing failed.", 500);
  } finally {
    await unlink(localPath).catch(() => undefined);
  }
}
