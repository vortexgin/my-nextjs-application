import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { ActionForm } from "@/app/base/components/action/ActionForm";
import { requireSession } from "@/libraries/Auth";
import { ActionGetUseCase } from "@/app/base/useCases/action/ActionGetUseCase";

export const metadata: Metadata = {
  title: "Edit action | VortexGin",
};

export default async function ActionEditPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const session = await requireSession();

  const { uuid } = await params;
  await connectDatabase();

  let action;
  try {
    action = await new ActionGetUseCase().exec(uuid);
  } catch {
    notFound();
  }
  if (!action) {
    notFound();
  }

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["base:action:view:update"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <ActionForm
          mode="edit"
          uuid={action.uuid}
          initial={{ action: action.action, description: action.description, status: action.status }}
        />
      </main>
    </AuthComponent>
  );
}
