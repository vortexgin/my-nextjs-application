import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { actorFromRequest } from "@/libraries/Auth";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok, queryParam } from "@/libraries/Http";
import { ActionCreateUseCase } from "@/app/base/useCases/action/ActionCreateUseCase";
import { ActionListUseCase } from "@/app/base/useCases/action/ActionListUseCase";
import type { CreateActionInput } from "@/app/base/models/ActionModel";

export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  try {
    await connectDatabase();
    const params = request.nextUrl.searchParams;
    const actions = await new ActionListUseCase().exec({
      filter: {
        q: queryParam(params, "filter[q]"),
        action: queryParam(params, "filter[action]"),
      },
      sortProperty: queryParam(params, "sortProperty"),
      sortDirection: queryParam(params, "sortDirection"),
      offset: queryParam(params, "offset"),
      limit: queryParam(params, "limit"),
    });
    return ok(actions);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch actions.", getErrorStatus(error, 500));
  }
}

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Partial<CreateActionInput>;

    const action = await new ActionCreateUseCase().exec(payload as CreateActionInput, await actorFromRequest(request));
    return ok(action, 201);
  } catch (error: any) {
    return fail(error.message ?? "Failed to create action.", getErrorStatus(error, 500));
  }
}

export const GET = withAuthorization(handleGet, ["base:action:list:list"]);
export const POST = withAuthorization(handlePost, ["base:action:create:create"]);
