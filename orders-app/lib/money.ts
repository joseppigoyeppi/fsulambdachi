const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** $12 for whole dollars, $13.50 otherwise. */
export function formatCents(cents: number): string {
  return cents % 100 === 0 ? usdWhole.format(cents / 100) : usd.format(cents / 100);
}

/** Parse a user-typed dollar amount ("18.99", "$18", "18,99") into whole cents. */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[^0-9.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
