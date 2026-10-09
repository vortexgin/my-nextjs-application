export class PdfError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message);
    this.name = "PdfError";
  }
}

export function safeGoogleError(error: unknown): PdfError {
  if (error instanceof PdfError) return error;
  const status = Number((error as any)?.code ?? (error as any)?.response?.status ?? 0);
  if (status === 429) return new PdfError("Google PDF service is temporarily rate limited.", 503);
  if (status === 401 || status === 403 || status === 404) {
    return new PdfError("The Google document is unavailable or not shared with the service account.", 502);
  }
  if ((error as any)?.code === "ETIMEDOUT" || (error as any)?.name === "AbortError") {
    return new PdfError("PDF generation timed out.", 504);
  }
  return new PdfError("Google PDF generation failed.", status >= 500 ? 503 : 502);
}
