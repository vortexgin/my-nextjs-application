import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/libraries/Auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/sso");
  }

  const user = session.user as { name?: string; email?: string };

  return (
    <DashboardShell
      user={{
        name: typeof user.name === "string" ? user.name : undefined,
        email: typeof user.email === "string" ? user.email : undefined,
      }}
    >
      {children}
    </DashboardShell>
  );
}
