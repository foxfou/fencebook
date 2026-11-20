export type Locale = "ru" | "en";

/** Item record from data/catalog/items.json (pipeline output). */
export interface Item {
  id: string;
  name_key: string | null;
  names: Record<string, string | null>;
  descriptions: Record<string, string | null>;
  icon: string | null;
  icon_sha1: string | null;
  icon_px: [number, number] | null;
  in_dataset: boolean;
  category: string | null;
  type: string | null;
  family: string | null;
  tier: number | null;
  rarity: number | null;
  rarity_name: string | null;
  size: [number, number] | null;
  slots: number | null;
  stack: number | null;
  sell: number | null;
  buy: number | null;
  value_per_slot: number | null;
  shipment_category: string | null;
  shipment_research: number | null;
  shipment_tier: string | null;
  purchase_from: string | null;
  loot_spot: string | null;
  loot_spot_count: number | null;
  missing: string[];
}

/** Light record for the list. Only this goes to the client, not the whole catalog. */
export interface ListItem {
  id: string;
  name: string;
  /** search string: ru and en names and the id, in lower case */
  search: string;
  category: string | null;
  rarity: number;
  w: number;
  h: number;
  sell: number | null;
  perSlot: number | null;
  hasIcon: boolean;
}
