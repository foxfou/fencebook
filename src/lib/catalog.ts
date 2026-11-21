// Data is read at build time. Pages are static, so the Worker does not need the catalog at runtime.
// The files data/catalog/*.json and public/icons/*.png live in the repository and change when the catalog is updated.
import itemsJson from "../../data/catalog/items.json";
import manifestJson from "../../data/catalog/manifest.json";
import { buildSlugs } from "./slug";
import type { Item, ListItem, Locale } from "./types";

export const items = itemsJson as unknown as Item[];
export const itemsById = new Map(items.map((i) => [i.id, i]));

/** URL slug of every item (see slug.ts): /<locale>/items/<slug>. */
const slugs = buildSlugs(items);
export const itemsBySlug = new Map(items.map((i) => [slugs.get(i.id)!, i]));

export function itemSlug(item: Item | string): string {
  const id = typeof item === "string" ? item : item.id;
  return slugs.get(id) ?? id;
}

/** Path of an item page without the language prefix: "/items/<slug>". */
export function itemPath(item: Item | string): string {
  return `/items/${itemSlug(item)}`;
}

export const manifest = manifestJson as {
  /** lastupdated: when Steam updated the game to this build (Unix seconds); the date of the data. */
  game: { buildid: number; lastupdated?: number };
  dataset: { version: number | null };
  counts: { items: number };
};

export function itemName(item: Item, locale: Locale | string): string {
  return item.names[locale] || item.names.en || item.id;
}

export function itemDescription(item: Item, locale: Locale | string): string {
  return item.descriptions[locale] || item.descriptions.en || "";
}

/** Categories that have items, the biggest first. Each has a page: /<locale>/items/category/<id>. */
export const categoryIds: string[] = (() => {
  const count = new Map<string, number>();
  for (const i of items) if (i.category) count.set(i.category, (count.get(i.category) ?? 0) + 1);
  return [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)! || a.localeCompare(b));
})();

export function itemsInCategory(category: string): Item[] {
  return items.filter((i) => i.category === category);
}

/** Path of a category page without the language prefix. */
export function categoryPath(category: string): string {
  return `/items/category/${category}`;
}

export function toListItems(locale: Locale, list: Item[] = items): ListItem[] {
  return list.map((i) => ({
    id: i.id,
    slug: itemSlug(i),
    name: itemName(i, locale),
    search: [i.names.ru, i.names.en, i.id].filter(Boolean).join(" ").toLowerCase(),
    category: i.category,
    rarity: i.rarity ?? 0,
    w: i.size?.[0] ?? 1,
    h: i.size?.[1] ?? 1,
    sell: i.sell,
    perSlot: i.value_per_slot,
    hasIcon: Boolean(i.icon),
  }));
}
