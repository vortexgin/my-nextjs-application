import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UpdateProfileForm } from "@/app/dashboard/components/forms/UpdateProfileForm";
import { getSession } from "@/libraries/Auth";

export const metadata: Metadata = {
  title: "Update profile | VortexGin",
};

export default async function UpdateProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/sso");
  }

  const user = session.user as { uuid?: string; name?: string; email?: string; phone_number?: string };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8 lg:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Update profile.</h1>
        <UpdateProfileForm
          user={{
            uuid: typeof user.uuid === "string" ? user.uuid : "",
            name: typeof user.name === "string" ? user.name : "",
            email: typeof user.email === "string" ? user.email : "",
            phone_number: typeof user.phone_number === "string" ? user.phone_number : "",
          }}
        />
      </div>
    </div>
  );
}
