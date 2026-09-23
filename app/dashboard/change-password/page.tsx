import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/app/sso/components/forms/ChangePasswordForm";
import { getSession } from "@/libraries/Auth";

export const metadata: Metadata = {
  title: "Change password | VortexGin",
};

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sso");
  }

  const user = session.user as { uuid?: string; email?: string };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8 lg:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Security</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Change password.</h1>
        <ChangePasswordForm
          user={{
            uuid: typeof user.uuid === "string" ? user.uuid : "",
            email: typeof user.email === "string" ? user.email : "",
          }}
        />
      </div>
    </div>
  );
}
