import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { actorFromRequest } from "@/libraries/Auth";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { ActionDeleteUseCase } from "@/app/base/useCases/action/ActionDeleteUseCase";
import { ActionGetUseCase } from "@/app/base/useCases/action/ActionGetUseCase";
import { ActionUpdateUseCase } from "@/app/base/useCases/action/ActionUpdateUseCase";
import type { UpdateActionInput } from "@/app/base/models/ActionModel";

export const runtime = "nodejs";

async function handleGet(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const action = await new ActionGetUseCase().exec(uuid);

    return ok(action);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch action.", getErrorStatus(error, 500));
  }
}

async function handlePut(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const payload = (await request.json()) as UpdateActionInput;

    const action = await new ActionUpdateUseCase().exec(uuid, payload, await actorFromRequest(request));
    return ok(action);
  } catch (error: any) {
    return fail(error.message ?? "Failed to update action.", getErrorStatus(error, 400));
  }
}

async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const deleted = await new ActionDeleteUseCase().exec(uuid, await actorFromRequest(request));

    if (!deleted) {
      return fail("Action not found.", 404);
    }

    return ok({ message: "Action deleted successfully." });
  } catch (error: any) {
    return fail(error.message ?? "Failed to delete action.", getErrorStatus(error, 400));
  }
}

export const GET = withAuthorization(handleGet, ["base:action:view:detail"]);
export const PUT = withAuthorization(handlePut, ["base:action:view:update"]);
export const DELETE = withAuthorization(handleDelete, ["base:action:view:delete"]);
