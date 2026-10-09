import type { Metadata } from "next";
import { requireSession } from "@/libraries/Auth";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { DocumentTemplateForm } from "@/app/base/components/documentTemplate/DocumentTemplateForm";
export const metadata: Metadata = { title: "New document template | VortexGin" };
export default async function Page() { const session = await requireSession(); return <AuthComponent user={session.user} permissions={session.permissions} allowedPermissions={["base:document-template:create:create"]} accessDeniedComponent={<AccessDenied />}><main className="min-h-screen px-4 py-8"><DocumentTemplateForm mode="create" /></main></AuthComponent>; }
