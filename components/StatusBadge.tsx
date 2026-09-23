const TONE: Record<string, string> = {
  active: "bg-green-50 text-green-700 ring-green-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONE[status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}
    >
      {status}
    </span>
  );
}
