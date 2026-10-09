import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/libraries/Auth";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { DocumentTemplateGetUseCase } from "@/app/base/useCases/documentTemplate/DocumentTemplateGetUseCase";
import { DocumentTemplateForm } from "@/app/base/components/documentTemplate/DocumentTemplateForm";
export const metadata: Metadata = { title: "Edit document template | VortexGin" };
export default async function Page({ params }: { params: Promise<{ uuid: string }> }) { const session = await requireSession(); await connectDatabase(); let row; try { row = await new DocumentTemplateGetUseCase().exec((await params).uuid, session.user as any); } catch { notFound(); } return <AuthComponent user={session.user} permissions={session.permissions} allowedPermissions={["base:document-template:view:update"]} accessDeniedComponent={<AccessDenied />}><main className="min-h-screen px-4 py-8"><DocumentTemplateForm mode="edit" uuid={row.uuid} initial={row} /></main></AuthComponent>; }
