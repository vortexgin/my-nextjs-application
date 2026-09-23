import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/libraries/Auth";

export const metadata: Metadata = {
  title: "Dashboard | VortexGin",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sso");
  }

  const user = session.user as { name?: string; email?: string };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8 lg:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Welcome{user.name ? `, ${user.name}` : ""}.
          </h1>
          {user.email ? (
            <p className="mt-3 text-base leading-7 text-slate-600">{user.email}</p>
          ) : null}
          <p className="mt-2 text-sm text-slate-500">
            Session expires {session.expired_at}.
          </p>
          <Link
            href="/sso"
            className="mt-8 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
