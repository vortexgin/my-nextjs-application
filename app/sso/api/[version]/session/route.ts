import { NextRequest } from "next/server";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { getSession } from "@/libraries/Auth";
import NotAuthorizedException from "@/exceptions/NotAuthorizedException";

export const runtime = "nodejs";

async function handleGet(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new NotAuthorizedException("Not authenticated.");
    }

    return ok({ user: session.user, permissions: session.permissions, expired_at: session.expired_at });
  } catch (error: any) {
    return fail(error.message ?? "Failed to fetch session.", getErrorStatus(error, 500));
  }
}

export const GET = withEncryption(handleGet);
