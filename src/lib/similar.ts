// "Similar items" on an item page: links between related pages help visitors and search engines move through the catalog.

interface Comparable {
  id: string;
  family: string | null;
  /** Localization key of the name: items without a family but with one name (lottery tickets) are kin too. */
  name_key?: string | null;
  category: string | null;
  type: string | null;
  rarity: number | null;
  sell: number | null;
}

/** How far apart two prices are, on a log scale: 100 and 1 000 are as far apart as 1 000 and 10 000. */
function priceGap(a: number | null, b: number | null): number {
  if (a === null || b === null) return Number.POSITIVE_INFINITY;
  return Math.abs(Math.log10(a + 1) - Math.log10(b + 1));
}

function closeTo<T extends Comparable>(item: T) {
  return (a: T, b: T) =>
    priceGap(a.sell, item.sell) - priceGap(b.sell, item.sell) ||
    Math.abs((a.rarity ?? 0) - (item.rarity ?? 0)) - Math.abs((b.rarity ?? 0) - (item.rarity ?? 0)) ||
    a.id.localeCompare(b.id);
}

/**
 * Up to `limit` items like this one, closest first:
 * 1. the same family or the same game name (other tiers and variants of the item), cheapest first;
 * 2. the same category and type, by price;
 * 3. the same category, by price;
 * 4. the same rarity, by price.
 */
export function similarItems<T extends Comparable>(item: T, all: T[], limit = 8): T[] {
  const picked: T[] = [];
  const seen = new Set([item.id]);
  const take = (list: T[]) => {
    for (const i of list) {
      if (picked.length >= limit) return;
      if (seen.has(i.id)) continue;
      seen.add(i.id);
      picked.push(i);
    }
  };
  const others = all.filter((i) => i.id !== item.id);
  const byPrice = closeTo(item);

  const kin = (i: T) =>
    (item.family !== null && i.family === item.family) || (item.name_key != null && i.name_key === item.name_key);
  if (item.family !== null || item.name_key != null) {
    take(
      others
        .filter(kin)
        .sort((a, b) => (a.sell ?? Infinity) - (b.sell ?? Infinity) || a.id.localeCompare(b.id)),
    );
  }
  if (item.category && item.type) {
    take(others.filter((i) => i.category === item.category && i.type === item.type).sort(byPrice));
  }
  if (item.category) take(others.filter((i) => i.category === item.category).sort(byPrice));
  take(others.filter((i) => i.rarity === item.rarity).sort(byPrice));
  return picked;
}
