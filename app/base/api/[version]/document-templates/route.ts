import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { actorFromRequest } from "@/libraries/Auth";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { collectFilters, fail, getErrorStatus, ok, queryParam } from "@/libraries/Http";
import { DocumentTemplateListUseCase } from "@/app/base/useCases/documentTemplate/DocumentTemplateListUseCase";
import { DocumentTemplateCreateUseCase } from "@/app/base/useCases/documentTemplate/DocumentTemplateCreateUseCase";
import type { CreateDocumentTemplateInput } from "@/app/base/models/DocumentTemplateModel";

export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  try {
    await connectDatabase();
    const params = request.nextUrl.searchParams;
    const rows = await new DocumentTemplateListUseCase().exec({ filter: collectFilters(params), sortProperty: queryParam(params, "sortProperty"), sortDirection: queryParam(params, "sortDirection"), offset: queryParam(params, "offset"), limit: queryParam(params, "limit") }, await actorFromRequest(request));
    return ok(rows);
  } catch (error: any) { return fail(error.message ?? "Failed to fetch document templates.", getErrorStatus(error, 500)); }
}

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const row = await new DocumentTemplateCreateUseCase().exec(await request.json() as CreateDocumentTemplateInput, await actorFromRequest(request));
    return ok(row, 201);
  } catch (error: any) { return fail(error.message ?? "Failed to create document template.", getErrorStatus(error, 500)); }
}

export const GET = withAuthorization(handleGet, ["base:document-template:list:list"]);
export const POST = withAuthorization(handlePost, ["base:document-template:create:create"]);
