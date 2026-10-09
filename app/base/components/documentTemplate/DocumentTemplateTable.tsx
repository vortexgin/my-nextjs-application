"use client";
import { useState, type FormEvent } from "react";
import { Table, type TableColumn, type TableRow } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import type { SessionInfo } from "@/libraries/Auth";
import { deleteEncrypted, getEncrypted } from "@/libraries/EncryptedFetch";
import type { DocumentTemplate } from "@/app/base/models/DocumentTemplateModel";

const API = "/base/api/v1/document-templates";
const columns: TableColumn[] = [{ key: "name", label: "Name", field: "name" }, { key: "document_type", label: "Type", field: "document_type" }, { key: "google_doc_id", label: "Google document", field: "google_doc_id", sortable: false }, { key: "status", label: "Status", field: "status" }, { key: "updated_at", label: "Updated", field: "updated_at" }];
export function DocumentTemplateTable({ session }: { session: SessionInfo }) {
  const [q, setQ] = useState(""); const [applied, setApplied] = useState<Record<string, string>>({});
  function filter(event: FormEvent) { event.preventDefault(); setApplied(q.trim() ? { "filter[q]": q.trim() } : {}); }
  return <div><form onSubmit={filter} className="mt-6 flex gap-3"><input type="search" value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Search templates..." /><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm text-white">Filter</button><button type="button" onClick={() => { setQ(""); setApplied({}); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Reset</button></form>
    <Table key={JSON.stringify(applied)} session={session} columns={columns} actionUpdate={["base:document-template:view:update"]} actionDelete={["base:document-template:view:delete"]} basePath="/base/views/document-templates" extraParams={applied} defaultSort={{ key: "name", dir: "asc" }} labelField="name"
      fetchRows={async (params) => { const response = await getEncrypted<DocumentTemplate[]>(`${API}?${params}`); if (!response.success) throw new Error(response.message); return (response.data ?? []) as TableRow[]; }}
      onDelete={async (uuid) => { const response = await deleteEncrypted<{ message: string }>(`${API}/${uuid}`); return response.success ? "" : response.message; }}
      renderCell={(column, _row, value) => column.key === "status" ? <StatusBadge status={String(value)} /> : column.key === "google_doc_id" ? <span className="font-mono text-xs">{String(value).slice(0, 18)}…</span> : column.key === "updated_at" ? <span>{new Date(String(value)).toLocaleString()}</span> : undefined} />
  </div>;
}
