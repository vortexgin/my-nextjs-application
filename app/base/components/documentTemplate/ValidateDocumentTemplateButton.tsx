"use client";
import { useState } from "react";
import { postEncrypted } from "@/libraries/EncryptedFetch";
import type { TemplateValidation } from "@/libraries/google/GoogleDocsTemplateRenderer";

export function ValidateDocumentTemplateButton({ uuid }: { uuid: string }) {
  const [pending, setPending] = useState(false); const [result, setResult] = useState<TemplateValidation | null>(null); const [error, setError] = useState("");
  async function validate() { if (pending) return; setPending(true); setError(""); try { const response = await postEncrypted<TemplateValidation>(`/base/api/v1/document-templates/${uuid}/validate`, {}); if (!response.success || !response.data) throw new Error(response.message); setResult(response.data); } catch (caught) { setError(caught instanceof Error ? caught.message : "Validation failed."); } finally { setPending(false); } }
  return <div className="w-full"><button type="button" onClick={validate} disabled={pending} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 disabled:opacity-60">{pending ? "Validating..." : "Validate template"}</button>{pending ? <p role="status" className="mt-2 text-sm text-slate-500">Checking Google document…</p> : null}{error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}{result ? <div role="status" className={`mt-3 rounded-xl border px-4 py-3 text-sm ${result.valid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}><p className="font-medium">{result.valid ? "Template is valid." : "Template has errors."}</p>{result.errors.map((item) => <p key={item}>• {item}</p>)}{result.warnings.map((item) => <p key={item} className="text-amber-700">• {item}</p>)}</div> : null}</div>;
}
