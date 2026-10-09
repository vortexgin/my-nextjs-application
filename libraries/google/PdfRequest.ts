import Joi from "joi";

export type PdfOutput = "download" | "print";
export type PdfRequestInput = { output?: PdfOutput; locale?: "id-ID" | "en-US"; timezone?: string; custom?: Record<string, string> };
export type ValidatedPdfRequest = { output: PdfOutput; locale: "id-ID" | "en-US"; timezone: string; custom: Record<string, string> };

const TIMEZONES = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "UTC"];
const customSchema = Joi.object().pattern(
  Joi.string().pattern(/^[a-z][a-z0-9_]{0,49}$/),
  Joi.string().max(500).allow(""),
).max(20).unknown(false).default({});

export const pdfRequestSchema = Joi.object({
  output: Joi.string().valid("download", "print").default("download"),
  locale: Joi.string().valid("id-ID", "en-US").default("id-ID"),
  timezone: Joi.string().valid(...TIMEZONES).default("Asia/Jakarta"),
  custom: customSchema,
}).unknown(false);

export function formatPdfDate(value: string | Date, locale: string, timezone: string, includeTime = false): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } : {}),
  }).format(new Date(value));
}
