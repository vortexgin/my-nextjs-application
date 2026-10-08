/**
 * Shared money/number display formatting (thousand separators, id-ID grouping).
 * Display-only: forms keep raw numeric inputs, snapshots stay unformatted.
 */
const groupFormatter = new Intl.NumberFormat("id-ID");

/** Formats a finite number with thousand separators, "—" otherwise. */
export function formatMoney(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? groupFormatter.format(value) : "—";
}
