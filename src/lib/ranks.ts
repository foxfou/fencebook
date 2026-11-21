// Where an item stands among the items of its category: used in the generated text of item and category pages.

interface Ranked {
  id: string;
  category: string | null;
  sell: number | null;
  value_per_slot: number | null;
}

export interface CategoryRanks {
  /** Items in the category (the item included). */
  n: number;
  /** Place by fence price, 1 = the most expensive; null when the item has no price. */
  sellRank: number | null;
  /** Place by value per slot, 1 = the best; null when the item has no value per slot. */
  slotRank: number | null;
}

function place<T extends Ranked>(item: T, list: T[], key: "sell" | "value_per_slot"): number | null {
  const v = item[key];
  if (v === null) return null;
  // Ties share a place: the number of items that are strictly better, plus one.
  return list.filter((i) => i[key] !== null && (i[key] as number) > v).length + 1;
}

export function categoryRanks<T extends Ranked>(item: T, all: T[]): CategoryRanks {
  if (!item.category) return { n: 0, sellRank: null, slotRank: null };
  const list = all.filter((i) => i.category === item.category);
  return { n: list.length, sellRank: place(item, list, "sell"), slotRank: place(item, list, "value_per_slot") };
}

/** The most expensive item and the best value per slot of a list (null when nobody has the value). */
export function leaders<T extends Ranked>(list: T[]): { top: T | null; bestSlot: T | null } {
  const best = (key: "sell" | "value_per_slot") =>
    list.reduce<T | null>((b, i) => (i[key] !== null && (b === null || (i[key] as number) > (b[key] as number)) ? i : b), null);
  return { top: best("sell"), bestSlot: best("value_per_slot") };
}
