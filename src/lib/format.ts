export function money(n: number | null | undefined, locale: string): string {
  if (n === null || n === undefined) return "—";
  return "$" + n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");
}
