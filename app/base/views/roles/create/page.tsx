import type { Metadata } from "next";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { RoleForm } from "@/app/base/components/role/RoleForm";
import { requireSession } from "@/libraries/Auth";

export const metadata: Metadata = {
  title: "New role | VortexGin",
};

export default async function RoleCreatePage() {
  const session = await requireSession();

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["base:role:create:create"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <RoleForm mode="create" />
      </main>
    </AuthComponent>
  );
}
