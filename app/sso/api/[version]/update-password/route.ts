import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { UpdatePasswordUseCase, type UpdatePasswordInput } from "@/app/sso/useCases/UpdatePasswordUseCase";

export const runtime = "nodejs";

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Partial<UpdatePasswordInput>;

    const result = await new UpdatePasswordUseCase().exec(payload as UpdatePasswordInput);
    return ok(result);
  } catch (error: any) {
    return fail(error.message ?? "Failed to update password.", getErrorStatus(error, 500));
  }
}

export const POST = withEncryption(handlePost);
