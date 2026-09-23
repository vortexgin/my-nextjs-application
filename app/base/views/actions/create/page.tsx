import type { Metadata } from "next";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { ActionForm } from "@/app/base/components/action/ActionForm";
import { requireSession } from "@/libraries/Auth";

export const metadata: Metadata = {
  title: "New action | VortexGin",
};

export default async function ActionCreatePage() {
  const session = await requireSession();

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["base:action:create:create"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <ActionForm mode="create" />
      </main>
    </AuthComponent>
  );
}
