import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { SESSION_COOKIE } from "@/app/sso/models/SessionModel";
import { LoginUseCase, SESSION_TTL_HOURS, type LoginInput } from "@/app/sso/useCases/LoginUseCase";

export const runtime = "nodejs";

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Partial<LoginInput>;

    const result = await new LoginUseCase().exec(payload as LoginInput);
    const response = ok(result);
    response.cookies.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(payload.rememberMe ? { maxAge: SESSION_TTL_HOURS * 60 * 60 } : {}),
    });
    return response;
  } catch (error: any) {
    return fail(error.message ?? "Login failed.", getErrorStatus(error, 500));
  }
}

export const POST = withEncryption(handlePost);
