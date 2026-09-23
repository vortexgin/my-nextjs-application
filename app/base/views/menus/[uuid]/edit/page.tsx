import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { MenuForm } from "@/app/base/components/menu/MenuForm";
import { requireSession } from "@/libraries/Auth";
import { MenuGetUseCase } from "@/app/base/useCases/menu/MenuGetUseCase";

export const metadata: Metadata = {
  title: "Edit menu | VortexGin",
};

export default async function MenuEditPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const session = await requireSession();

  const { uuid } = await params;
  await connectDatabase();

  let menu;
  try {
    menu = await new MenuGetUseCase().exec(uuid);
  } catch {
    notFound();
  }
  if (!menu) {
    notFound();
  }

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["base:menus:view:update"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <MenuForm
          mode="edit"
          uuid={menu.uuid}
          initial={{
            icon: menu.icon,
            parent: menu.parent,
            menu: menu.menu,
            action_id: menu.action_id,
            description: menu.description,
            redirection: menu.redirection,
            weight: menu.weight,
            status: menu.status,
          }}
        />
      </main>
    </AuthComponent>
  );
}
