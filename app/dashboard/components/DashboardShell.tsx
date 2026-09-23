"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/app/dashboard/components/Sidebar";
import { Topbar } from "./Topbar";

export function DashboardShell({
  session,
  children,
}: {
  session: { user: unknown; permissions: string[] };
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  const sessionUser = session.user as { name?: unknown; email?: unknown };

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar session={session} />
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Sidebar menu">
          <div className="absolute inset-0 bg-slate-950/50" onClick={closeSidebar} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            <Sidebar session={session} onNavigate={closeSidebar} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{
            name: typeof sessionUser.name === "string" ? sessionUser.name : undefined,
            email: typeof sessionUser.email === "string" ? sessionUser.email : undefined,
          }}
          onMenuClick={() => setSidebarOpen((value) => !value)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
