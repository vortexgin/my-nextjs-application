import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { ForgotPasswordUseCase, type ForgotPasswordInput } from "@/app/sso/useCases/ForgotPasswordUseCase";

export const runtime = "nodejs";

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Partial<ForgotPasswordInput>;

    const result = await new ForgotPasswordUseCase().exec(payload as ForgotPasswordInput);
    return ok(result);
  } catch (error: any) {
    return fail(error.message ?? "Failed to process request.", getErrorStatus(error, 500));
  }
}

export const POST = withEncryption(handlePost);
