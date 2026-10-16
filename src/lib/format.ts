export function naira(n: number | null | undefined) {
  return "₦" + Math.round(n ?? 0).toLocaleString("en-NG");
}

export function niceDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T12:00:00" : "")) : d;
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO() {
  // Lagos is UTC+1 with no daylight saving.
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
