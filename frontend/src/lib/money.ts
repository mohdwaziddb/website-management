const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/** 1299 / "1299.5" -> "₹1,299.00" / "₹1,299.50"; khaali / galat -> "—" */
export function rupee(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? INR.format(n) : "—";
}

/** List cell: label me "₹" ho to rupee, warna plain number (e.g. "Discount Value" -> 10) */
export function formatDecimal(label: string, v: unknown): string {
  if (v == null || v === "") return "—";
  if (label.includes("₹")) return rupee(v);
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : String(v);
}
