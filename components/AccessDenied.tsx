import Link from "next/link";

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">Denied</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Access denied.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {message ?? "You do not have permission to view this page."}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
