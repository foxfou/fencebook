"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import {
  DEFAULT_FILTERS,
  hasFilters,
  parseFilters,
  saveLastQuery,
  serializeFilters,
  type Filters,
  type Sort,
} from "@/lib/catalogFilters";
import { money } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import type { ListItem } from "@/lib/types";
import { SearchField } from "./SearchField";

interface Props {
  items: ListItem[];
  locale: string;
  t: Dict["catalog"];
  rarities: Dict["rarities"];
  /** Links to the category pages (CategoryNav), shown at the top of the side panel on wide screens. */
  categoryNav?: ReactNode;
  /** Remember the filters for the "All items" links (the main catalog only). */
  rememberQuery?: boolean;
}

const RARITY_ORDER = [1, 2, 4, 5, 6, 0];

function toggled<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/*
 * The filters are read from the address (see catalogFilters.ts), so they survive going to an item page and back.
 * replaceState changes the address without a new history entry: "back" from the catalog still leaves the catalog.
 * Next.js does not fire an event for it, so the listeners are told here. popstate covers back and forward.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

function writeFilters(f: Filters): void {
  const qs = serializeFilters(f);
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  listeners.forEach((l) => l());
}

function useFilters(remember: boolean): [Filters, (patch: Partial<Filters>) => void] {
  // The static page is rendered without filters; the browser applies the ones in the address right after loading.
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  const filters = useMemo(() => parseFilters(search), [search]);
  useEffect(() => {
    if (remember) saveLastQuery(search);
  }, [remember, search]);
  const update = (patch: Partial<Filters>) => writeFilters({ ...parseFilters(window.location.search), ...patch });
  return [filters, update];
}

function num(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function compareNullable(a: number | null, b: number | null, dir: 1 | -1): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // items without a price always go last
  if (b === null) return -1;
  return (a - b) * dir;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-2.5">
      <h3 className="display mb-1.5 text-sm text-ink-3">{title}</h3>
      {children}
    </section>
  );
}

export function ItemBrowser({ items, locale, t, rarities, categoryNav, rememberQuery = true }: Props) {
  const [filters, update] = useFilters(rememberQuery);
  const { q, rars, min, max, sort } = filters;
  const [open, setOpen] = useState(false);

  const rarCounts = useMemo(() => {
    const m = new Map<number, number>();
    for (const i of items) m.set(i.rarity, (m.get(i.rarity) ?? 0) + 1);
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const lo = num(min);
    const hi = num(max);
    const list = items.filter((i) => {
      if (query && !i.search.includes(query)) return false;
      if (rars.length && !rars.includes(i.rarity)) return false;
      if (lo !== null && (i.sell === null || i.sell < lo)) return false;
      if (hi !== null && (i.sell === null || i.sell > hi)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "sellDesc") return compareNullable(a.sell, b.sell, -1) || a.name.localeCompare(b.name, locale);
      if (sort === "sellAsc") return compareNullable(a.sell, b.sell, 1) || a.name.localeCompare(b.name, locale);
      if (sort === "perSlot") return compareNullable(a.perSlot, b.perSlot, -1) || a.name.localeCompare(b.name, locale);
      return a.name.localeCompare(b.name, locale);
    });
    return list;
  }, [items, q, rars, min, max, sort, locale]);

  const filtersOn = hasFilters(filters);
  const reset = () => update(DEFAULT_FILTERS);

  const field =
    "w-full rounded border border-line-2 bg-field px-3 py-2 text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none";

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* The panel stays in view while the list scrolls, so the category and the filters can be changed at any point
          (filters-panel in globals.css: on screens tall enough to show all of it; on a short one it scrolls with the page). */}
      <aside className="filters-panel">
        <div className="flex gap-2">
          <SearchField
            value={q}
            onChange={(v) => update({ q: v })}
            placeholder={t.search}
            clearLabel={t.clearSearch}
            className="min-w-0 flex-1"
            inputClassName="py-2"
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="skew shrink-0 bg-surface-2 px-3 text-ink-2 hover:text-ink lg:hidden"
          >
            <span className="display text-sm">{t.filters}</span>
          </button>
        </div>

        <div className={`${open ? "block" : "hidden"} mt-3 space-y-3 lg:block`}>
          {/* Phones get the category chips above the list instead (see the pages). */}
          {categoryNav && (
            <div className="hidden lg:block">
              <Group title={t.category}>{categoryNav}</Group>
            </div>
          )}


          <Group title={t.rarity}>
            <ul>
              {RARITY_ORDER.filter((r) => rarCounts.has(r)).map((r) => (
                <li key={r}>
                  <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-ink-2 hover:text-ink">
                    <input
                      type="checkbox"
                      checked={rars.includes(r)}
                      onChange={() => update({ rars: toggled(rars, r) })}
                      className="accent-accent"
                    />
                    <span className="size-2.5 rounded-sm" style={{ background: `var(--color-r${r})` }} />
                    <span className="flex-1">{rarities[String(r)]}</span>
                    <span className="tabular-nums text-ink-3">{rarCounts.get(r)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Group>

          <Group title={t.price}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={min}
                onChange={(e) => update({ min: e.target.value })}
                placeholder={t.from}
                aria-label={`${t.price}: ${t.from}`}
                className={field}
              />
              <span className="text-ink-3">–</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={max}
                onChange={(e) => update({ max: e.target.value })}
                placeholder={t.to}
                aria-label={`${t.price}: ${t.to}`}
                className={field}
              />
            </div>
          </Group>

          {filtersOn && (
            <button type="button" onClick={reset} className="skew w-full bg-surface-2 py-2 text-ink-2 hover:text-ink">
              <span className="display text-sm">{t.reset}</span>
            </button>
          )}
        </div>
      </aside>

      <div>
        {/* Sorting sits over the list it orders, which also keeps the side panel short enough to fit the screen.
            Left-aligned: the grid is made of fixed-width cells, so its right edge moves with the window width,
            while its left edge never does. */}
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="catalog-sort" className="display text-sm text-ink-3">
            {t.sort}
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => update({ sort: e.target.value as Sort })}
            className="rounded border border-line-2 bg-field px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="name">{t.sortName}</option>
            <option value="sellDesc">{t.sortSellDesc}</option>
            <option value="sellAsc">{t.sortSellAsc}</option>
            <option value="perSlot">{t.sortPerSlot}</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <p className="text-ink-2">{t.empty}</p>
        ) : (
          <ul className="inv-grid">
            {filtered.map((i) => (
              <li
                key={i.id}
                className="tile"
                style={{ "--w": i.w, "--h": i.h, "--r": `var(--color-r${i.rarity})` } as CSSProperties}
              >
                <Link href={`/${locale}/items/${i.slug}`} className="absolute inset-0 block">
                  {i.hasIcon && (
                    // The name is the image's alt text: the link gets a readable name for people and search engines.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/icons/${i.id}.png`} alt={i.name} loading="lazy" decoding="async" />
                  )}
                  {i.sell !== null && <span className="price">{money(i.sell, locale)}</span>}
                  <span className="tip">
                    <span className="display block text-base leading-tight">{i.name}</span>
                    <span className="mt-1 block text-xs text-ink-2">{rarities[String(i.rarity)]}</span>
                    {i.sell !== null && (
                      <span className="mt-1 block text-sm">
                        {money(i.sell, locale)}
                        {i.perSlot !== null && i.w * i.h > 1 && (
                          <span className="text-ink-3"> · {money(i.perSlot, locale)} / {i.w * i.h}</span>
                        )}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {/* The count goes under the list: the category chips above already show how many items there are. */}
        <p className="mt-3 text-sm text-ink-3" aria-live="polite">
          {t.found}: {filtered.length} {t.of} {items.length}
        </p>
      </div>
    </div>
  );
}
