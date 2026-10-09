import Link from "next/link";
import type { Metadata } from "next";
import { requireSession } from "@/libraries/Auth";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { DocumentTemplateTable } from "@/app/base/components/documentTemplate/DocumentTemplateTable";
export const metadata: Metadata = { title: "Document templates | VortexGin" };
export default async function Page() { const session = await requireSession(); return <AuthComponent user={session.user} permissions={session.permissions} allowedPermissions={["base:document-template:list:list"]} accessDeniedComponent={<AccessDenied />}><main className="min-h-screen px-4 py-8"><div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 sm:p-8"><div className="flex justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Base</p><h1 className="mt-2 text-3xl font-semibold">Document templates.</h1></div><AuthComponent user={session.user} permissions={session.permissions} allowedPermissions={["base:document-template:create:create"]}><Link href="/base/views/document-templates/create" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm text-white">New template</Link></AuthComponent></div><DocumentTemplateTable session={session} /></div></main></AuthComponent>; }
