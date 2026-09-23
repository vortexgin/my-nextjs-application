import { cookies } from "next/headers";
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
