import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { UserDeleteUseCase } from "@/app/base/useCases/user/UserDeleteUseCase";
import { UserGetUseCase } from "@/app/base/useCases/user/UserGetUseCase";
import { UserUpdateUseCase } from "@/app/base/useCases/user/UserUpdateUseCase";
import type { UpdateUserInput } from "@/app/base/models/UserModel";

export const runtime = "nodejs";

async function handleGet(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const user = await new UserGetUseCase().exec(uuid);

    return ok(user);
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch user.", getErrorStatus(error, 500));
  }
}

async function handlePut(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    const payload = (await request.json()) as UpdateUserInput;

    const user = await new UserUpdateUseCase().exec(uuid, payload);
    return ok(user);
  } catch (error: any) {
    return fail(error.message ?? "Failed to update user.", getErrorStatus(error, 400));
  }
}

async function handleDelete(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    await connectDatabase();
    const { uuid } = await params;
    await new UserDeleteUseCase().exec(uuid);

    return ok({ message: "User deleted successfully." });
  } catch (error: any) {
    return fail(error.message ?? "Failed to delete user.", getErrorStatus(error, 400));
  }
}

export const GET = withAuthorization(withEncryption(handleGet), ["base:user:view:detail"]);
export const PUT = withAuthorization(withEncryption(handlePut), ["authorized", "base:user:view:update"]);
export const DELETE = withAuthorization(withEncryption(handleDelete), ["base:user:view:delete"]);
