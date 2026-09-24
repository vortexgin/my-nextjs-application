import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { RoleForm } from "@/app/base/components/role/RoleForm";
import { requireSession } from "@/libraries/Auth";
import { RoleGetUseCase } from "@/app/base/useCases/role/RoleGetUseCase";
import { ActionListUseCase } from "@/app/base/useCases/action/ActionListUseCase";

export const metadata: Metadata = {
  title: "Edit role | VortexGin",
};

export default async function RoleEditPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const session = await requireSession();

  const { uuid } = await params;
  await connectDatabase();

  let role;
  try {
    role = await new RoleGetUseCase().exec(uuid);
  } catch {
    notFound();
  }
  if (!role) {
    notFound();
  }

  // Map granted permission codes to action UUIDs for preselect.
  const actions = await new ActionListUseCase().exec({
    sortProperty: "action",
    sortDirection: "asc",
    offset: 0,
    limit: 100,
  });
  const codeToUuid = new Map(actions.map((action) => [action.action, action.uuid]));
  const actionIds = role.permissions
    .map((code) => codeToUuid.get(code))
    .filter((id): id is string => typeof id === "string");

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["base:role:view:update"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <RoleForm
          mode="edit"
          uuid={role.uuid}
          initial={{
            name: role.name,
            slug: role.slug,
            status: role.status,
            action_ids: actionIds,
          }}
        />
      </main>
    </AuthComponent>
  );
}
