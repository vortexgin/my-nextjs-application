import type { Metadata } from "next";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { UserForm } from "@/app/base/components/user/UserForm";
import { ADMIN_ROLE_SLUG } from "@/libraries/Permissions";
import { requireSession } from "@/libraries/Auth";

export const metadata: Metadata = {
  title: "New user | VortexGin",
};

export default async function UserCreatePage() {
  const session = await requireSession();

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["base:user:create:create"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <UserForm mode="create" session={{ user: session.user, permissions: session.permissions }} adminRoleSlug={ADMIN_ROLE_SLUG} />
      </main>
    </AuthComponent>
  );
}
