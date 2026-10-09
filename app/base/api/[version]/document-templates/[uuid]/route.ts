import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { actorFromRequest } from "@/libraries/Auth";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { DocumentTemplateGetUseCase } from "@/app/base/useCases/documentTemplate/DocumentTemplateGetUseCase";
import { DocumentTemplateUpdateUseCase } from "@/app/base/useCases/documentTemplate/DocumentTemplateUpdateUseCase";
import { DocumentTemplateDeleteUseCase } from "@/app/base/useCases/documentTemplate/DocumentTemplateDeleteUseCase";
import type { UpdateDocumentTemplateInput } from "@/app/base/models/DocumentTemplateModel";

export const runtime = "nodejs";
type Context = { params: Promise<{ uuid: string }> };

async function handleGet(request: NextRequest, { params }: Context) {
  try { await connectDatabase(); return ok(await new DocumentTemplateGetUseCase().exec((await params).uuid, await actorFromRequest(request))); }
  catch (error: any) { return fail(error.message ?? "Failed to fetch document template.", getErrorStatus(error, 500)); }
}
async function handlePut(request: NextRequest, { params }: Context) {
  try { await connectDatabase(); return ok(await new DocumentTemplateUpdateUseCase().exec((await params).uuid, await request.json() as UpdateDocumentTemplateInput, await actorFromRequest(request))); }
  catch (error: any) { return fail(error.message ?? "Failed to update document template.", getErrorStatus(error, 500)); }
}
async function handleDelete(request: NextRequest, { params }: Context) {
  try { await connectDatabase(); await new DocumentTemplateDeleteUseCase().exec((await params).uuid, await actorFromRequest(request)); return ok({ message: "Document template deleted successfully." }); }
  catch (error: any) { return fail(error.message ?? "Failed to delete document template.", getErrorStatus(error, 500)); }
}

export const GET = withAuthorization(handleGet, ["base:document-template:view:detail"]);
export const PUT = withAuthorization(handlePut, ["authorized", "base:document-template:view:update"]);
export const DELETE = withAuthorization(handleDelete, ["base:document-template:view:delete"]);
