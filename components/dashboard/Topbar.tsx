import { UserMenu, type DashboardUser } from "./UserMenu";

export function Topbar({
  user,
  onMenuClick,
}: {
  user: DashboardUser;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Toggle sidebar menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-600 transition hover:bg-slate-50 lg:hidden"
          >
            ☰
          </button>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Dashboard</p>
            <p className="hidden text-xs text-slate-500 sm:block">Welcome back to your workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
