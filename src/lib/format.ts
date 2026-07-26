/**
 * format.ts
 *
 * Generic cell formatting used by DataTable. Since every dataset (Portfolio,
 * Watchlist, Transactions, etc.) has different columns, we format by pattern
 * matching the column name rather than hardcoding per-dataset logic - keeps
 * one table component working across every sheet.
 */

const CURRENCY_HINTS = ["price", "value", "cost", "gain", "amount", "balance", "commission"];
const PERCENT_HINTS = ["%", "percent", "weight"];
const DATE_HINTS = ["date"];

export function isIsoDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function columnHints(column: string, hints: string[]): boolean {
  const lower = column.toLowerCase();
  return hints.some((h) => lower.includes(h));
}

export function formatCell(column: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (isIsoDateString(value)) {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  if (typeof value === "number") {
    if (columnHints(column, PERCENT_HINTS)) {
      return `${value.toFixed(2)}%`;
    }
    if (columnHints(column, CURRENCY_HINTS)) {
      return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
    }
    return value.toLocaleString("en-US");
  }

  return String(value);
}

/** Returns 'gain' | 'loss' | null for coloring numeric cells like Gain %, Unrealized Gain. */
export function cellTone(column: string, value: unknown): "gain" | "loss" | null {
  if (typeof value !== "number") return null;
  const lower = column.toLowerCase();
  const isSignedMetric = lower.includes("gain") || lower.includes("today");
  if (!isSignedMetric) return null;
  if (value > 0) return "gain";
  if (value < 0) return "loss";
  return null;
}
