"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { money } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import type { ListItem } from "@/lib/types";

type Sort = "name" | "sellDesc" | "sellAsc" | "perSlot";

interface Props {
  items: ListItem[];
  locale: string;
  t: Dict["catalog"];
  categories: Dict["categories"];
  rarities: Dict["rarities"];
}

const RARITY_ORDER = [1, 2, 4, 5, 6, 0];

function toggled<T>(set: Set<T>, v: T): Set<T> {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
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
    <section className="border-t border-line pt-3">
      <h3 className="display mb-2 text-sm text-ink-3">{title}</h3>
      {children}
    </section>
  );
}

export function ItemBrowser({ items, locale, t, categories, rarities }: Props) {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [rars, setRars] = useState<Set<number>>(new Set());
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState<Sort>("name");
  const [open, setOpen] = useState(false);

  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) if (i.category) m.set(i.category, (m.get(i.category) ?? 0) + 1);
    return m;
  }, [items]);

  const rarCounts = useMemo(() => {
    const m = new Map<number, number>();
    for (const i of items) m.set(i.rarity, (m.get(i.rarity) ?? 0) + 1);
    return m;
  }, [items]);

  const catList = useMemo(
    () => [...catCounts.keys()].sort((a, b) => (categories[a] ?? a).localeCompare(categories[b] ?? b, locale)),
    [catCounts, categories, locale],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const lo = num(min);
    const hi = num(max);
    const list = items.filter((i) => {
      if (query && !i.search.includes(query)) return false;
      if (cats.size && (!i.category || !cats.has(i.category))) return false;
      if (rars.size && !rars.has(i.rarity)) return false;
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
  }, [items, q, cats, rars, min, max, sort, locale]);

  const hasFilters = q !== "" || cats.size > 0 || rars.size > 0 || min !== "" || max !== "" || sort !== "name";
  const reset = () => {
    setQ("");
    setCats(new Set());
    setRars(new Set());
    setMin("");
    setMax("");
    setSort("name");
  };

  const field =
    "w-full rounded border border-line-2 bg-field px-3 py-2 text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none";

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="flex gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
            className={field}
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

        <div className={`${open ? "block" : "hidden"} mt-4 space-y-4 lg:block`}>
          <label className="block">
            <span className="display mb-2 block text-sm text-ink-3">{t.sort}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={field}>
              <option value="name">{t.sortName}</option>
              <option value="sellDesc">{t.sortSellDesc}</option>
              <option value="sellAsc">{t.sortSellAsc}</option>
              <option value="perSlot">{t.sortPerSlot}</option>
            </select>
          </label>

          <Group title={t.category}>
            <ul>
              {catList.map((c) => (
                <li key={c}>
                  <label className="flex cursor-pointer items-center gap-2 py-1 text-ink-2 hover:text-ink">
                    <input
                      type="checkbox"
                      checked={cats.has(c)}
                      onChange={() => setCats((s) => toggled(s, c))}
                      className="accent-accent"
                    />
                    <span className="flex-1">{categories[c] ?? c}</span>
                    <span className="tabular-nums text-ink-3">{catCounts.get(c)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Group>

          <Group title={t.rarity}>
            <ul>
              {RARITY_ORDER.filter((r) => rarCounts.has(r)).map((r) => (
                <li key={r}>
                  <label className="flex cursor-pointer items-center gap-2 py-1 text-ink-2 hover:text-ink">
                    <input
                      type="checkbox"
                      checked={rars.has(r)}
                      onChange={() => setRars((s) => toggled(s, r))}
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
                onChange={(e) => setMin(e.target.value)}
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
                onChange={(e) => setMax(e.target.value)}
                placeholder={t.to}
                aria-label={`${t.price}: ${t.to}`}
                className={field}
              />
            </div>
          </Group>

          {hasFilters && (
            <button type="button" onClick={reset} className="skew w-full bg-surface-2 py-2 text-ink-2 hover:text-ink">
              <span className="display text-sm">{t.reset}</span>
            </button>
          )}
        </div>
      </aside>

      <div>
        <p className="mb-3 text-sm text-ink-3" aria-live="polite">
          {t.found}: {filtered.length} {t.of} {items.length}
        </p>
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
                <Link href={`/${locale}/items/${i.id}`} className="absolute inset-0 block" aria-label={i.name}>
                  {i.hasIcon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/icons/${i.id}.png`} alt="" loading="lazy" decoding="async" />
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
      </div>
    </div>
  );
}
