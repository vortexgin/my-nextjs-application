export function Pagination({
  page,
  hasNext,
  loading,
  offset,
  count,
  onPrev,
  onNext,
}: {
  page: number;
  hasNext: boolean;
  loading: boolean;
  offset: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500" aria-live="polite">
        {count === 0 && !loading
          ? "No records."
          : `Showing ${offset + 1}–${offset + count} · Page ${page}${hasNext ? "+" : ""}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading || offset === 0}
          onClick={onPrev}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Prev
        </button>
        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
          {page}
        </span>
        <button
          type="button"
          disabled={loading || !hasNext}
          onClick={onNext}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
