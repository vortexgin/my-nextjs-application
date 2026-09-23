import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { actorFromRequest } from "@/libraries/Auth";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { MenuDeleteUseCase } from "@/app/base/useCases/menu/MenuDeleteUseCase";
import { MenuGetUseCase } from "@/app/base/useCases/menu/MenuGetUseCase";
import { MenuUpdateUseCase } from "@/app/base/useCases/menu/MenuUpdateUseCase";
import type { UpdateMenuInput } from "@/app/base/models/MenuModel";

export const runtime = "nodejs";

async function handleGet(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const menu = await new MenuGetUseCase().exec(uuid);

    return ok(menu);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch menu.", getErrorStatus(error, 500));
  }
}

async function handlePut(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const payload = (await request.json()) as UpdateMenuInput;

    const menu = await new MenuUpdateUseCase().exec(uuid, payload, await actorFromRequest(request));
    return ok(menu);
  } catch (error: any) {
    return fail(error.message ?? "Failed to update menu.", getErrorStatus(error, 400));
  }
}

async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const deleted = await new MenuDeleteUseCase().exec(uuid, await actorFromRequest(request));

    if (!deleted) {
      return fail("Menu not found.", 404);
    }

    return ok({ message: "Menu deleted successfully." });
  } catch (error: any) {
    return fail(error.message ?? "Failed to delete menu.", getErrorStatus(error, 400));
  }
}

export const GET = withAuthorization(handleGet, ["base:menus:view:detail"]);
export const PUT = withAuthorization(handlePut, ["base:menus:view:update"]);
export const DELETE = withAuthorization(handleDelete, ["base:menus:view:delete"]);
