import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { actorFromRequest } from "@/libraries/Auth";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok, queryParam } from "@/libraries/Http";
import { MenuCreateUseCase } from "@/app/base/useCases/menu/MenuCreateUseCase";
import { MenuListUseCase } from "@/app/base/useCases/menu/MenuListUseCase";
import type { CreateMenuInput } from "@/app/base/models/MenuModel";

export const runtime = "nodejs";

async function handleGet(request: NextRequest) {
  try {
    await connectDatabase();
    const params = request.nextUrl.searchParams;
    const menus = await new MenuListUseCase().exec({
      filter: {
        q: queryParam(params, "filter[q]"),
        menu: queryParam(params, "filter[menu]"),
        action_id: queryParam(params, "filter[action_id]"),
        parent: queryParam(params, "filter[parent]"),
      },
      sortProperty: queryParam(params, "sortProperty"),
      sortDirection: queryParam(params, "sortDirection"),
      offset: queryParam(params, "offset"),
      limit: queryParam(params, "limit"),
    });
    return ok(menus);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch menus.", getErrorStatus(error, 500));
  }
}

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Partial<CreateMenuInput>;

    const menu = await new MenuCreateUseCase().exec(payload as CreateMenuInput, await actorFromRequest(request));
    return ok(menu, 201);
  } catch (error: any) {
    return fail(error.message ?? "Failed to create menu.", getErrorStatus(error, 500));
  }
}

export const GET = withAuthorization(handleGet, ["base:menus:list:list"]);
export const POST = withAuthorization(handlePost, ["base:menus:create:create"]);
