import type { Metadata } from "next";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { MenuForm } from "@/app/base/components/menu/MenuForm";
import { requireSession } from "@/libraries/Auth";

export const metadata: Metadata = {
  title: "New menu | VortexGin",
};

export default async function MenuCreatePage() {
  const session = await requireSession();

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["base:menus:create:create"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <MenuForm mode="create" />
      </main>
    </AuthComponent>
  );
}
