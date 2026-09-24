import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { UserForm } from "@/app/base/components/user/UserForm";
import { requireSession } from "@/libraries/Auth";
import { UserGetUseCase } from "@/app/base/useCases/user/UserGetUseCase";

export const metadata: Metadata = {
  title: "Edit user | VortexGin",
};

export default async function UserEditPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const session = await requireSession();

  const { uuid } = await params;
  await connectDatabase();

  let user;
  try {
    user = await new UserGetUseCase().exec(uuid);
  } catch {
    notFound();
  }
  if (!user) {
    notFound();
  }

  return (
    <AuthComponent
      user={session.user}
      permissions={session.permissions}
      allowedPermissions={["base:user:view:update"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <UserForm
          mode="edit"
          uuid={user.uuid}
          initial={{
            name: user.name,
            email: user.email,
            phone_number: user.phone_number,
            status: user.status,
            role_id: user.role?.uuid ?? "",
          }}
        />
      </main>
    </AuthComponent>
  );
}
