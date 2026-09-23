import { NextRequest } from "next/server";
import { withEncryption } from "@/libraries/EncryptedRoute";
import { fail } from "@/libraries/Http";
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
 * Pure access matcher, exported for testing. Grants when required list
 * empty, contains "authorized", matches user role slug, or overlaps
 * session permissions (any match).
 */
export function checkAccess(requiredActions: string[], permissions: string[], roleSlug?: string | null): boolean {
  if (requiredActions.length === 0 || requiredActions.includes("authorized")) {
    return true;
  }

  return requiredActions.some((action) => action === roleSlug || permissions.includes(action));
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

    if (requiredActions && requiredActions.length > 0 && !requiredActions.includes("authorized")) {
      const permissions = Array.isArray(session.permissions)
        ? session.permissions.filter((permission): permission is string => typeof permission === "string")
        : [];
      const role = (session.user as { role?: { slug?: unknown } } | null)?.role;
      const roleSlug = typeof role?.slug === "string" ? role.slug : null;
      if (!checkAccess(requiredActions, permissions, roleSlug)) {
        return fail("Insufficient permissions.", 403);
      }
    }

    return encrypted(request, context);
  };
}
