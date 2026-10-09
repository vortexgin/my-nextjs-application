"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { DocumentTemplate } from "@/app/base/models/DocumentTemplateModel";
import { DOCUMENT_TEMPLATE_LIST_PATH } from "@/app/base/views/document-templates/paths";
import { postEncrypted, putEncrypted } from "@/libraries/EncryptedFetch";
import { SelectField, TextField } from "@/components/FormField";

const API = "/base/api/v1/document-templates";
export function DocumentTemplateForm({ mode, uuid, initial }: { mode: "create" | "edit"; uuid?: string; initial?: DocumentTemplate }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError("");
    try {
      const data = new FormData(event.currentTarget);
      const payload: Record<string, string> = { name: String(data.get("name") ?? ""), google_doc_id: String(data.get("google_doc_id") ?? ""), status: String(data.get("status") ?? "active") };
      if (mode === "create") payload.document_type = String(data.get("document_type") ?? "");
      const response = mode === "create" ? await postEncrypted<DocumentTemplate>(API, payload) : await putEncrypted<DocumentTemplate>(`${API}/${uuid}`, payload);
      if (!response.success) throw new Error(response.message || "Failed to save document template.");
      router.push(mode === "create" ? DOCUMENT_TEMPLATE_LIST_PATH : `${DOCUMENT_TEMPLATE_LIST_PATH}/${uuid}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Failed to save document template."); }
    finally { setPending(false); }
  }
  return <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:p-8">
    <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Base</p>
    <h1 className="mt-2 text-2xl font-semibold text-slate-900">{mode === "create" ? "Configure PDF template" : "Update PDF template"}</h1>
    <form onSubmit={submit} className="mt-6 space-y-5">
      {mode === "create" ? <SelectField label="Document type" name="document_type" required defaultValue={initial?.document_type ?? "purchase_request"} options={[{ value: "purchase_request", label: "Purchase request" }, { value: "sales_order", label: "Sales order" }, { value: "delivery_order", label: "Delivery order" }, { value: "stock_report", label: "Stock report" }]} /> : null}
      <TextField label="Name" name="name" required minLength={2} maxLength={160} defaultValue={initial?.name ?? ""} />
      <TextField label="Google Docs URL or ID" name="google_doc_id" required maxLength={500} defaultValue={initial?.google_doc_id ?? ""} hint="Share the master Google Doc with the configured service account." />
      <SelectField label="Status" name="status" defaultValue={initial?.status ?? "active"} options={[{ value: "active", label: "active" }, { value: "inactive", label: "inactive" }]} />
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-3"><button type="submit" disabled={pending} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{pending ? "Saving..." : "Save template"}</button><Link href={DOCUMENT_TEMPLATE_LIST_PATH} className="rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-700">Cancel</Link></div>
    </form>
  </div>;
}
