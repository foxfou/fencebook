// Catalog filters live in the page address (?q=…&rarity=…&min=…&max=…&sort=…).
// Categories are not a filter: each has its own page (/items/category/<id>), linked from the side panel.
// Going to an item page and back keeps them, and a filtered list can be shared as a link.

export const SORTS = ["name", "sellDesc", "sellAsc", "perSlot"] as const;
export type Sort = (typeof SORTS)[number];

export interface Filters {
  q: string;
  rars: number[];
  /** Price inputs as typed ("" means no limit). */
  min: string;
  max: string;
  sort: Sort;
}

export const DEFAULT_FILTERS: Filters = { q: "", rars: [], min: "", max: "", sort: "name" };

function list(v: string | null): string[] {
  return v ? v.split(",").filter(Boolean) : [];
}

function price(v: string | null): string {
  return v && /^\d+$/.test(v) ? v : "";
}

/** Reads filters from a query string ("?q=…" or "q=…"). Unknown or broken values fall back to the defaults. */
export function parseFilters(search: string): Filters {
  const p = new URLSearchParams(search);
  const sort = p.get("sort");
  return {
    q: p.get("q") ?? "",
    rars: [...new Set(list(p.get("rarity")).map(Number).filter((n) => Number.isInteger(n) && n >= 0))],
    min: price(p.get("min")),
    max: price(p.get("max")),
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as Sort) : "name",
  };
}

/** Query string for the filters, without "?". Default values are left out, so a clean catalog has a clean address. */
export function serializeFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.rars.length) p.set("rarity", [...f.rars].sort((a, b) => a - b).join(","));
  if (f.min) p.set("min", f.min);
  if (f.max) p.set("max", f.max);
  if (f.sort !== "name") p.set("sort", f.sort);
  // Keep commas readable in the address bar: they are safe in a query string.
  return p.toString().replace(/%2C/gi, ",");
}

export function hasFilters(f: Filters): boolean {
  return serializeFilters(f) !== "";
}

// The last catalog query of this tab, so the "All items" link on an item page goes back to the same filtered list.
const LAST_QUERY_KEY = "fencebook:catalog-query";

export function saveLastQuery(search: string): void {
  try {
    sessionStorage.setItem(LAST_QUERY_KEY, search.replace(/^\?/, ""));
  } catch {
    /* storage blocked: the link just opens the catalog without filters */
  }
}

export function lastQuery(): string {
  try {
    return sessionStorage.getItem(LAST_QUERY_KEY) ?? "";
  } catch {
    return "";
  }
}
