import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDatabase } from "@/database/sequelize";
import { AuthComponent } from "@/components/AuthComponent";
import { AccessDenied } from "@/components/AccessDenied";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { DeleteMenuButton } from "@/app/base/components/menu/DeleteMenuButton";
import { MENU_LIST_PATH } from "@/app/base/views/menus/paths";
import { requireSession } from "@/libraries/Auth";
import { MenuGetUseCase } from "@/app/base/useCases/menu/MenuGetUseCase";

export const metadata: Metadata = {
  title: "Menu detail | VortexGin",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="break-all text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export default async function MenuDetailPage({
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
      allowedPermissions={["base:menus:view:detail"]}
      accessDeniedComponent={
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <AccessDenied />
        </main>
      }
    >

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Detail</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {menu.menu}
            </h1>

            <dl className="mt-6">
              <Row label="UUID" value={menu.uuid} />
              <Row label="Menu" value={menu.menu} />
              <Row label="Icon" value={menu.icon || "—"} />
              <Row label="Parent" value={menu.parent ?? "—"} />
              <Row label="Action" value={menu.action ?? "—"} />
              <Row label="Action ID" value={menu.action_id} />
              <Row label="Description" value={menu.description ?? "—"} />
              <Row label="Redirection" value={menu.redirection} />
              <Row label="Weight" value={String(menu.weight)} />
              <Row label="Status" value={menu.status} />
              <Row label="Created" value={menu.created_at} />
              <Row label="Updated" value={menu.updated_at} />
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={MENU_LIST_PATH}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back to list
              </Link>
              <AuthComponent
                user={session.user}
                permissions={session.permissions}
                allowedPermissions={["base:menus:view:update"]}
              >
                <Link
                  href={`/base/views/menus/${menu.uuid}/edit`}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Edit
                </Link>
              </AuthComponent>
              <AuthComponent
                user={session.user}
                permissions={session.permissions}
                allowedPermissions={["base:menus:view:delete"]}
              >
                <DeleteMenuButton uuid={menu.uuid} label={menu.menu} redirectTo={MENU_LIST_PATH} />
              </AuthComponent>

            </div>
          </div>
          <ActivityTimeline entity="menu" entityUuid={menu.uuid} />
        </div>
      </main>
    </AuthComponent>
  );
}
