"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDatabase } from "@/database/sequelize";
import { SESSION_COOKIE } from "@/app/sso/models/SessionModel";
import { LogoutUseCase } from "@/app/sso/useCases/LogoutUseCase";

/**
 * Soft-deletes the current DB session via LogoutUseCase, clears the
 * session cookie, then sends the user back to sign in.
 */
export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  try {
    await connectDatabase();
    await new LogoutUseCase().exec({ token });
  } catch {
    // Still clear the cookie even if the DB update fails.
  }

  store.delete(SESSION_COOKIE);
  redirect("/sso");
}
