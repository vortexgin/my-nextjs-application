import { cookies } from "next/headers";
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
 * rejects missing / unknown / expired tokens. Returns null on any failure.
 */
export async function getSession(): Promise<SessionInfo | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  await connectDatabase();
  const SessionModel = await getSessionModel();
  const session = await SessionModel.findOne({
    where: { uuid: token, expired_at: { [Op.gt]: literal("NOW()") } },
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
