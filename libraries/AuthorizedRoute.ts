import { NextRequest } from "next/server";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail } from "@/libraries/Http";
import { hasPermission } from "@/libraries/Permissions";
import { SESSION_COOKIE } from "@/app/sso/models/SessionModel";
import { getSessionByToken } from "@/libraries/Auth";

type RouteHandler<TContext> = (request: NextRequest, context: TContext) => Promise<Response>;

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (header && header.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    return token || null;
  }

  return request.cookies.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Pure access matcher, exported for testing. Same rule as
 * hasPermission: session already verified upstream, so user
 * counts as present; empty or "authorized" requirement grants,
 * otherwise role slug or permission overlap required.
 */
export function checkAccess(requiredActions: string[], permissions: string[], roleSlug?: string | null): boolean {
  return hasPermission(true, permissions, requiredActions, roleSlug);
}

/**
 * Authorization middleware for protected APIs. Requires a live session:
 * `Authorization: Bearer <token>` header, or session cookie for
 * same-origin browser calls. When `requiredActions` set, at least one
 * entry must match: "authorized" (any live session), user role slug,
 * or a fresh session permission code.
 */
export function withAuthorization<TContext>(handler: RouteHandler<TContext>, requiredActions?: string[]): RouteHandler<TContext> {
  const encrypted = withEncryption(handler);

  return async (request: NextRequest, context: TContext) => {
    const token = bearerToken(request);
    if (!token) {
      return fail("Not authenticated.", 401);
    }

    let session = null;
    try {
      session = await getSessionByToken(token);
    } catch {
      session = null;
    }
    if (!session) {
      return fail("Not authenticated.", 401);
    }

    if (requiredActions && requiredActions.length > 0) {
      const permissions = Array.isArray(session.permissions)
        ? session.permissions.filter((permission): permission is string => typeof permission === "string")
        : [];
      if (!hasPermission(session.user, permissions, requiredActions)) {
        return fail("Insufficient permissions.", 403);
      }
    }

    return encrypted(request, context);
  };
}
