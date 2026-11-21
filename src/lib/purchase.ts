// "Where to buy" comes from the dataset as English text, for example
// "Trade Laptop (tier II); Car Parts Dealer (price ×3 · Citizens only)".
// It is parsed here into sources, so the page can show them in the visitor's language.

/** Shops in the raid where a Civilian (before putting on a mask) can buy the item. */
export const SHOPS = [
  "electronics",
  "arms",
  "armor",
  "carParts",
  "comicsLiquor",
  "jewelry",
  "medical",
  "liquor",
] as const;
export type ShopId = (typeof SHOPS)[number];

const SHOP_NAMES: Record<string, ShopId> = {
  "Electronics Dealer": "electronics",
  "Arms Dealer": "arms",
  "Armor Dealer": "armor",
  "Car Parts Dealer": "carParts",
  "Comics and Liquor Dealer": "comicsLiquor",
  "Jewelry Dealer": "jewelry",
  "Medical Supplies Dealer": "medical",
  "Liquor Dealer": "liquor",
};

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3 };

export type PurchaseSource =
  /** The Black Market (the trade laptop). `tier`: settlement level needed, null when there is no condition. */
  | { kind: "blackMarket"; tier: number | null }
  /** A shop in the raid. `priceFactor`: how many times the base price it costs; `civiliansOnly`: only before the mask is on. */
  | { kind: "shop"; shop: ShopId; priceFactor: number | null; civiliansOnly: boolean }
  /** Text the parser does not know (a new source after a data update): shown as it is. */
  | { kind: "other"; text: string };

function parseOne(part: string): PurchaseSource {
  const m = part.match(/^(.+?)\s*(?:\((.*)\))?$/);
  const name = m?.[1]?.trim() ?? part;
  const notes = m?.[2] ?? "";
  if (name === "Trade Laptop") {
    const tier = notes.match(/tier\s+(I{1,3})\b/i)?.[1];
    return { kind: "blackMarket", tier: tier ? (ROMAN[tier.toUpperCase()] ?? null) : null };
  }
  const shop = SHOP_NAMES[name];
  if (shop) {
    const factor = notes.match(/price\s*[×x]\s*(\d+(?:\.\d+)?)/i)?.[1];
    return { kind: "shop", shop, priceFactor: factor ? Number(factor) : null, civiliansOnly: /citizens only/i.test(notes) };
  }
  return { kind: "other", text: part.trim() };
}

export function parsePurchase(text: string | null | undefined): PurchaseSource[] {
  if (!text) return [];
  return text
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map(parseOne);
}

/** Loot spot types from the dataset ("Weapons & ammo"), keys of the translated names in i18n. */
export const LOOT_SPOTS = [
  "Weapons & ammo",
  "Art & antiques",
  "Gear",
  "Electronics",
  "Jewellery displays",
  "Car parts",
  "Medicine",
  "Alcohol & cigars",
  "Drug stashes",
  "Cash registers",
] as const;
