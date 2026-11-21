import Link from "next/link";
import { categoryIds, categoryPath, items, itemsInCategory } from "@/lib/catalog";

/**
 * Links to the whole catalog ("All") and to every category page: plain links, so search engines find the category
 * pages from the catalog, and a category page has a way back. `current`: the category of the page, none on the catalog.
 */
export function CategoryNav({
  locale,
  label,
  allLabel,
  names,
  current,
  variant = "chips",
}: {
  locale: string;
  label: string;
  allLabel: string;
  names: Record<string, string>;
  current?: string;
  /** chips: a wrapping row (phones, above the list); list: rows like the rarity filter (the side panel). */
  variant?: "chips" | "list";
}) {
  const chips = [
    { key: "all", href: `/${locale}/items`, name: allLabel, count: items.length, active: current === undefined },
    ...categoryIds.map((c) => ({
      key: c,
      href: `/${locale}${categoryPath(c)}`,
      name: names[c] ?? c,
      count: itemsInCategory(c).length,
      active: c === current,
    })),
  ];
  if (variant === "list") {
    return (
      <nav aria-label={label}>
        <ul>
          {chips.map((c) => (
            <li key={c.key}>
              <Link
                href={c.href}
                aria-current={c.active ? "page" : undefined}
                className={`-mx-2 flex items-center gap-2 rounded px-2 py-0.5 text-sm ${
                  c.active ? "bg-surface-2 text-ink" : "text-ink-2 hover:text-ink"
                }`}
              >
                <span className={`h-3.5 w-0.5 rounded-full ${c.active ? "bg-accent" : "bg-transparent"}`} aria-hidden="true" />
                <span className="flex-1">{c.name}</span>
                <span className="tabular-nums text-ink-3">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c.key}>
            <Link
              href={c.href}
              aria-current={c.active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded border px-3 py-1 text-sm ${
                c.active ? "border-accent text-ink" : "border-line text-ink-2 hover:border-line-2 hover:text-ink"
              }`}
            >
              {c.name}
              <span className="tabular-nums text-ink-3">{c.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
