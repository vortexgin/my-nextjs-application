import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { RoleDeleteUseCase } from "@/app/base/useCases/role/RoleDeleteUseCase";
import { RoleGetUseCase } from "@/app/base/useCases/role/RoleGetUseCase";
import { RoleUpdateUseCase } from "@/app/base/useCases/role/RoleUpdateUseCase";
import type { UpdateRoleInput } from "@/app/base/models/RoleModel";

export const runtime = "nodejs";

async function handleGet(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const role = await new RoleGetUseCase().exec(uuid);

    return ok(role);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch role.", getErrorStatus(error, 500));
  }
}

async function handlePut(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const payload = (await request.json()) as UpdateRoleInput;

    const role = await new RoleUpdateUseCase().exec(uuid, payload);
    return ok(role);
  } catch (error: any) {
    return fail(error.message ?? "Failed to update role.", getErrorStatus(error, 400));
  }
}

async function handleDelete(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const deleted = await new RoleDeleteUseCase().exec(uuid);

    if (!deleted) {
      return fail("Role not found.", 404);
    }

    return ok({ message: "Role deleted successfully." });
  } catch (error: any) {
    return fail(error.message ?? "Failed to delete role.", getErrorStatus(error, 400));
  }
}

export const GET = withAuthorization(withEncryption(handleGet), ["base:role:view:detail"]);
export const PUT = withAuthorization(withEncryption(handlePut), ["base:role:view:update"]);
export const DELETE = withAuthorization(withEncryption(handleDelete), ["base:role:view:delete"]);
