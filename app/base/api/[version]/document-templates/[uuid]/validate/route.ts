import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { actorFromRequest } from "@/libraries/Auth";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { DocumentTemplateValidateUseCase } from "@/app/base/useCases/documentTemplate/DocumentTemplateValidateUseCase";

export const runtime = "nodejs";
async function handlePost(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  try { await connectDatabase(); return ok(await new DocumentTemplateValidateUseCase().exec((await params).uuid, await actorFromRequest(request))); }
  catch (error: any) { return fail(error.message ?? "Failed to validate document template.", getErrorStatus(error, 500)); }
}
export const POST = withAuthorization(handlePost, ["base:document-template:view:validate"]);
