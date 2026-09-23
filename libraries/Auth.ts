import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { Op, literal } from "sequelize";
import { connectDatabase } from "@/database/sequelize";
import { SESSION_COOKIE, getSessionModel } from "@/app/sso/models/SessionModel";

export type SessionInfo = {
  token: string;
  user: Record<string, unknown>;
  permissions: string[];
  expired_at: string;
};

/**
 * Server-only session check. Reads session cookie, loads live session row,
 * rejects missing / unknown / expired / logged-out tokens. Returns null on any failure.
 */
export async function getSession(): Promise<SessionInfo | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return getSessionByToken(token);
}

/** Same check for an explicit token (e.g. Authorization header). */
export async function getSessionByToken(token: string): Promise<SessionInfo | null> {
  if (!token) {
    return null;
  }

  await connectDatabase();
  const SessionModel = await getSessionModel();
  const session = await SessionModel.findOne({
    where: {
      uuid: token,
      status: "active",
      deleted_at: null,
      expired_at: { [Op.gt]: literal("NOW()") },
    },
  });
  if (!session) {
    return null;
  }

  return {
    token,
    user: session.user_info,
    permissions: session.permissions ?? [],
    expired_at: session.expired_at.toISOString(),
  };
}

/**
 * Page-level guard. Returns live session, redirects to sign in
 * when none exists. Callers check permissions with
 * hasPermission() and render AccessDenied on denial.
 */
export async function requireSession(): Promise<SessionInfo> {
  const session = await getSession();
  if (!session) {
    redirect("/sso");
  }
  return session;
}

/**
 * Resolves the live session from an incoming request: session
 * cookie first, `Authorization: Bearer <token>` fallback.
 * Returns null when missing or unknown. Never throws.
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionInfo | null> {
  try {
    const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (cookieToken) {
      return await getSessionByToken(cookieToken);
    }

    const header = request.headers.get("authorization");
    if (header && header.toLowerCase().startsWith("bearer ")) {
      const token = header.slice(7).trim();
      if (token) {
        return await getSessionByToken(token);
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Full session user object for activity logging. Null when
 * anonymous. Never throws.
 */
export async function actorFromRequest(request: NextRequest): Promise<Record<string, unknown> | null> {
  const session = await getSessionFromRequest(request).catch(() => null);
  const user = session?.user;
  return user && typeof user === "object" ? (user as Record<string, unknown>) : null;
}
