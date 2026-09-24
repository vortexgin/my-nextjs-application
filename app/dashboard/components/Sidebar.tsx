"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Menu } from "@/app/base/models/MenuModel";
import { AuthComponent } from "@/components/AuthComponent";
import { getEncrypted } from "@/libraries/EncryptedFetch";

type SidebarSession = {
  user: unknown;
  permissions: string[];
};

function orderByWeight(menus: Menu[]): Menu[] {
  return [...menus].sort((a, b) => a.weight - b.weight);
}

export function Sidebar({
  session,
  collapsed,
  onNavigate,
}: {
  session: SidebarSession;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const [menus, setMenus] = useState<Menu[]>([]);

  useEffect(() => {
    let cancelled = false;

    getEncrypted<Menu[]>("/base/api/v1/menus?sortProperty=weight&sortDirection=asc&limit=100")
      .then((menusEnvelope) => {
        if (cancelled) {
          return;
        }
        if (menusEnvelope.success) {
          setMenus(menusEnvelope.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMenus([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const roots = orderByWeight(menus.filter((menu) => !menu.parent));
  const childrenOf = (uuid: string) => orderByWeight(menus.filter((menu) => menu.parent === uuid));

  return (
    <aside className="flex h-full min-h-screen w-full shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-950 p-4 text-white">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        title="VortexGin"
        className={`mb-6 flex items-center gap-3 px-2 pt-2 ${collapsed ? "justify-center" : ""}`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-base font-semibold text-blue-300 ring-1 ring-inset ring-blue-400/30">
          V
        </div>
        {collapsed ? null : <span className="text-lg font-semibold tracking-tight">VortexGin</span>}
      </Link>

      <nav className="flex flex-col gap-1">
        {roots.map((root) => (
          <AuthComponent
            key={root.uuid}
            user={session.user}
            permissions={session.permissions}
            allowedPermissions={root.action ? [root.action] : []}
          >
            <div className="flex flex-col gap-1">
              <Link
                href={root.redirection}
                onClick={onNavigate}
                title={root.menu}
                className={`rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 ${collapsed ? "flex justify-center" : ""}`}
              >
                {!!root.icon && root.icon}
                {collapsed ? null : <> {root.menu}</>}
              </Link>
              {childrenOf(root.uuid).map((child) =>
                child.action ? (
                  <AuthComponent
                    key={child.uuid}
                    user={session.user}
                    permissions={session.permissions}
                    allowedPermissions={[child.action]}
                  >
                    <Link
                      href={child.redirection}
                      onClick={onNavigate}
                      title={child.menu}
                      className={`rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/10 hover:text-slate-200 ${collapsed ? "flex justify-center" : "pl-6"}`}
                    >
                      {!!child.icon && child.icon}
                      {collapsed ? null : <> {child.menu}</>}
                    </Link>
                  </AuthComponent>
                ) : null,
              )}
            </div>
          </AuthComponent>
        ))}
      </nav>
    </aside>
  );
}
